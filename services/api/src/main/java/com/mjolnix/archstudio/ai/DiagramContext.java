package com.mjolnix.archstudio.ai;

import com.fasterxml.jackson.databind.JsonNode;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Traduz o diagrama do usuário para um resumo legível.
 * O JSON cru serve para editar com precisão; este resumo é o que faz a Ari
 * realmente "enxergar" o desenho: quem é quem, o que se liga a quê, o que está
 * solto — base para ela perguntar onde conectar e sugerir melhorias concretas.
 */
public final class DiagramContext {
    private DiagramContext() {}

    /** @return resumo legível, ou null se não houver desenho. */
    public static String describe(JsonNode doc) {
        if (doc == null || doc.isNull()) {
            return null;
        }
        JsonNode st = doc.has("state") ? doc.get("state") : doc;
        JsonNode nodes = st.path("nodes");
        if (!nodes.isArray() || nodes.isEmpty()) {
            return null;
        }
        JsonNode edges = st.path("edges");
        JsonNode boxes = st.path("boxes");
        JsonNode texts = st.path("texts");

        Map<String, String> refById = new LinkedHashMap<>();   // id numérico -> como a IA deve referenciar
        Set<String> connected = new LinkedHashSet<>();

        StringBuilder sb = new StringBuilder();
        sb.append("COMPONENTES (").append(nodes.size()).append("):\n");
        for (JsonNode n : nodes) {
            String id = n.path("id").asText("");
            String label = n.path("label").asText("").trim();
            String type = n.path("type").asText("api");
            String aid = n.path("aid").asText("").trim();
            String ref = !aid.isEmpty() ? aid : (!label.isEmpty() ? label : id);
            refById.put(id, ref);

            sb.append("- ");
            if (!aid.isEmpty()) {
                sb.append('[').append(aid).append("] ");
            }
            sb.append('"').append(label.isEmpty() ? ref : label).append('"');
            sb.append(" (").append(type).append(')');
            String group = groupOf(n, boxes);
            if (group != null) {
                sb.append(" — dentro de: ").append(group);
            }
            sb.append('\n');
        }

        List<String> conns = new ArrayList<>();
        if (edges.isArray()) {
            for (JsonNode e : edges) {
                String from = refById.get(e.path("from").asText(""));
                String to = refById.get(e.path("to").asText(""));
                if (from == null || to == null) {
                    continue;
                }
                connected.add(from);
                connected.add(to);
                String label = e.path("label").asText("").trim();
                boolean dash = e.path("dash").asBoolean(false);
                conns.add("- \"" + from + "\" " + (dash ? "..." : "--")
                        + (label.isEmpty() ? "" : label + (dash ? "..." : "--"))
                        + "> \"" + to + "\"" + (dash ? "  (tracejada/assíncrona)" : ""));
            }
        }
        sb.append("\nCONEXÕES (").append(conns.size()).append("):\n");
        sb.append(conns.isEmpty() ? "- (nenhuma ainda)\n" : String.join("\n", conns) + "\n");

        if (boxes.isArray() && !boxes.isEmpty()) {
            List<String> names = new ArrayList<>();
            for (JsonNode b : boxes) {
                String l = b.path("label").asText("").trim();
                if (!l.isEmpty()) {
                    names.add(l);
                }
            }
            if (!names.isEmpty()) {
                sb.append("\nGRUPOS/FRONTEIRAS: ").append(String.join(" · ", names)).append('\n');
            }
        }

        if (texts.isArray() && !texts.isEmpty()) {
            List<String> notes = new ArrayList<>();
            for (JsonNode t : texts) {
                String v = t.path("text").asText("").replace('\n', ' ').trim();
                if (!v.isEmpty()) {
                    notes.add("- " + (v.length() > 160 ? v.substring(0, 160) + "…" : v));
                }
            }
            if (!notes.isEmpty()) {
                sb.append("\nANOTAÇÕES NO CANVAS:\n").append(String.join("\n", notes)).append('\n');
            }
        }

        List<String> orphans = new ArrayList<>();
        for (String ref : refById.values()) {
            if (!connected.contains(ref)) {
                orphans.add('"' + ref + '"');
            }
        }
        if (!orphans.isEmpty()) {
            sb.append("\nSEM NENHUMA CONEXÃO (candidatos a ligar): ")
              .append(String.join(", ", orphans)).append('\n');
        }
        return sb.toString();
    }

    /** Descobre em qual caixa o nó está, pelo centro dele. */
    private static String groupOf(JsonNode n, JsonNode boxes) {
        if (!boxes.isArray()) {
            return null;
        }
        double s = n.path("s").asDouble(1);
        double cx = n.path("x").asDouble(Double.NaN) + 118 * s / 2;
        double cy = n.path("y").asDouble(Double.NaN) + 66 * s / 2;
        if (Double.isNaN(cx) || Double.isNaN(cy)) {
            return null;
        }
        for (JsonNode b : boxes) {
            double bx = b.path("x").asDouble(0), by = b.path("y").asDouble(0);
            double bw = b.path("w").asDouble(0), bh = b.path("h").asDouble(0);
            if (cx >= bx && cx <= bx + bw && cy >= by && cy <= by + bh) {
                String l = b.path("label").asText("").trim();
                return l.isEmpty() ? null : l;
            }
        }
        return null;
    }
}
