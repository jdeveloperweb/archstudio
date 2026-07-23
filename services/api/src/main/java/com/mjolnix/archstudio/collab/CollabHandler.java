package com.mjolnix.archstudio.collab;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mjolnix.archstudio.domain.Project;
import com.mjolnix.archstudio.project.ProjectService;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * Real-time collaboration over a raw WebSocket at {@code /ws/collab}. One room per
 * shared project (keyed by the invite token). Presence (who is here, with a name
 * and a color) plus full-document broadcast with last-write-wins. The room's doc
 * is persisted to Postgres on a debounce so anonymous edits survive.
 *
 * <p>Sharing model: whoever holds the token may join and edit — the token is the
 * authorization (validated on handshake). The display name is provided by the
 * client (profile name for logged-in users, a typed name for guests).
 */
@Component
public class CollabHandler extends TextWebSocketHandler {

    private static final String[] COLORS =
            {"#a679ff", "#ff9900", "#22d3ee", "#4ade80", "#f472b6", "#7c9eff", "#f87171", "#facc15"};
    private static final int MAX_PEERS_PER_ROOM = 24;
    private static final SecureRandom RNG = new SecureRandom();

    private final ProjectService projects;
    private final ObjectMapper mapper;
    private final Map<String, Room> rooms = new ConcurrentHashMap<>();
    private final ScheduledExecutorService flusher = Executors.newSingleThreadScheduledExecutor(r -> {
        Thread t = new Thread(r, "collab-flush");
        t.setDaemon(true);
        return t;
    });

    public CollabHandler(ProjectService projects, ObjectMapper mapper) {
        this.projects = projects;
        this.mapper = mapper;
        // persist dirty rooms every couple seconds (anonymous edits must not be lost)
        flusher.scheduleWithFixedDelay(this::flushDirty, 2, 2, TimeUnit.SECONDS);
    }

    /** A connected participant. */
    private static final class Peer {
        final WebSocketSession session;
        final String id;
        final String name;
        final String color;
        Peer(WebSocketSession session, String id, String name, String color) {
            this.session = session; this.id = id; this.name = name; this.color = color;
        }
        Map<String, Object> pub() {
            Map<String, Object> m = new HashMap<>();
            m.put("id", id); m.put("name", name); m.put("color", color);
            return m;
        }
    }

    /** One shared project. */
    private static final class Room {
        final String token;
        final Map<String, Peer> peers = new ConcurrentHashMap<>();
        volatile String doc;        // canvas document JSON (string)
        volatile boolean dirty;
        int colorSeq;
        Room(String token, String doc) { this.token = token; this.doc = doc; }
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        Map<String, String> q = query(session);
        String token = q.get("token");
        Project p = projects.byShareToken(token).orElse(null);
        if (p == null) {
            session.close(new CloseStatus(4001, "invalid-token"));
            return;
        }
        String roomKey = p.getId().toString();
        Room room = rooms.computeIfAbsent(roomKey, k -> new Room(token, safeDoc(p.getDoc())));
        if (room.peers.size() >= MAX_PEERS_PER_ROOM) {
            session.close(new CloseStatus(4002, "room-full"));
            return;
        }
        String color;
        synchronized (room) { color = COLORS[room.colorSeq++ % COLORS.length]; }
        Peer me = new Peer(session, shortId(), cleanName(q.get("name")), color);
        session.getAttributes().put("room", roomKey);
        session.getAttributes().put("peer", me);
        room.peers.put(session.getId(), me);

        // 1) hand the newcomer the current doc + who is already here + its own identity
        Map<String, Object> init = new HashMap<>();
        init.put("t", "init");
        init.put("you", me.pub());
        init.put("doc", parse(room.doc));
        init.put("peers", peerList(room));
        send(session, init);
        // 2) tell everyone the presence list changed
        broadcastPeers(room);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String roomKey = (String) session.getAttributes().get("room");
        Peer me = (Peer) session.getAttributes().get("peer");
        if (roomKey == null || me == null) return;
        Room room = rooms.get(roomKey);
        if (room == null) return;

        JsonNode msg;
        try { msg = mapper.readTree(message.getPayload()); } catch (Exception e) { return; }
        String type = msg.path("t").asText("");

        switch (type) {
            case "doc" -> {
                JsonNode doc = msg.get("doc");
                if (doc == null || doc.isNull()) return;
                room.doc = doc.toString();
                room.dirty = true;
                Map<String, Object> out = new HashMap<>();
                out.put("t", "doc");
                out.put("doc", doc);
                out.put("from", me.id);
                broadcastOthers(room, session, out);
            }
            case "cursor" -> {
                Map<String, Object> out = new HashMap<>();
                out.put("t", "cursor");
                out.put("from", me.id);
                out.put("name", me.name);
                out.put("color", me.color);
                out.put("x", msg.path("x").asDouble());
                out.put("y", msg.path("y").asDouble());
                broadcastOthers(room, session, out);
            }
            default -> { /* ignore unknown */ }
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        String roomKey = (String) session.getAttributes().get("room");
        if (roomKey == null) return;
        Room room = rooms.get(roomKey);
        if (room == null) return;
        room.peers.remove(session.getId());
        if (room.peers.isEmpty()) {
            // last one out: persist and drop the room
            if (room.dirty) projects.saveDocByToken(room.token, room.doc);
            rooms.remove(roomKey);
        } else {
            broadcastPeers(room);
        }
    }

    // ---------------------------------------------------------------- helpers

    private void flushDirty() {
        for (Room room : rooms.values()) {
            if (room.dirty) {
                room.dirty = false;
                try { projects.saveDocByToken(room.token, room.doc); } catch (Exception ignored) { }
            }
        }
    }

    private void broadcastPeers(Room room) {
        Map<String, Object> out = new HashMap<>();
        out.put("t", "peers");
        out.put("peers", peerList(room));
        for (Peer p : room.peers.values()) send(p.session, out);
    }

    private void broadcastOthers(Room room, WebSocketSession from, Map<String, Object> payload) {
        for (Peer p : room.peers.values()) {
            if (!p.session.getId().equals(from.getId())) send(p.session, payload);
        }
    }

    private List<Map<String, Object>> peerList(Room room) {
        List<Map<String, Object>> list = new ArrayList<>();
        for (Peer p : room.peers.values()) list.add(p.pub());
        return list;
    }

    private void send(WebSocketSession session, Object payload) {
        if (!session.isOpen()) return;
        try {
            String json = mapper.writeValueAsString(payload);
            synchronized (session) { session.sendMessage(new TextMessage(json)); }
        } catch (Exception ignored) { }
    }

    private JsonNode parse(String json) {
        try { return mapper.readTree(json == null || json.isBlank() ? "{}" : json); }
        catch (Exception e) { return mapper.createObjectNode(); }
    }

    private String safeDoc(String doc) {
        return (doc == null || doc.isBlank()) ? "{}" : doc;
    }

    private Map<String, String> query(WebSocketSession session) {
        Map<String, String> out = new HashMap<>();
        String q = session.getUri() == null ? null : session.getUri().getQuery();
        if (q == null) return out;
        for (String pair : q.split("&")) {
            int i = pair.indexOf('=');
            if (i <= 0) continue;
            String k = URLDecoder.decode(pair.substring(0, i), StandardCharsets.UTF_8);
            String v = URLDecoder.decode(pair.substring(i + 1), StandardCharsets.UTF_8);
            out.put(k, v);
        }
        return out;
    }

    private String cleanName(String name) {
        if (name == null) return "Convidado";
        String n = name.trim().replaceAll("\\s+", " ");
        if (n.isEmpty()) return "Convidado";
        return n.length() > 40 ? n.substring(0, 40) : n;
    }

    private String shortId() {
        byte[] b = new byte[6];
        RNG.nextBytes(b);
        StringBuilder sb = new StringBuilder();
        for (byte x : b) sb.append(Integer.toHexString(x & 0xff | 0x100).substring(1));
        return sb.toString();
    }
}
