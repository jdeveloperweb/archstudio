// Cliente de colaboração em tempo real. O transporte é um WebSocket para
// /ws/collab (mesma origem, atrás do nginx); em dev pode-se apontar para a API
// com NEXT_PUBLIC_WS_URL. A sala é definida pelo token do link de convite.

export type Peer = { id: string; name: string; color: string };
export type RemoteCursor = { from: string; name: string; color: string; x: number; y: number };
export type CollabStatus = 'connecting' | 'open' | 'closed';

export type CollabHandlers = {
  onInit?: (doc: any, peers: Peer[], me: Peer) => void;
  onDoc?: (doc: any) => void;
  onPeers?: (peers: Peer[]) => void;
  onCursor?: (c: RemoteCursor) => void;
  onStatus?: (s: CollabStatus) => void;
};

export type CollabSession = {
  sendDoc: (doc: any) => void;
  sendCursor: (x: number, y: number) => void;
  close: () => void;
};

function wsUrl(token: string, name: string): string {
  const base =
    process.env.NEXT_PUBLIC_WS_URL ||
    (typeof window !== 'undefined'
      ? (window.location.protocol === 'https:' ? 'wss:' : 'ws:') + '//' + window.location.host + '/ws/collab'
      : '');
  const q = `token=${encodeURIComponent(token)}&name=${encodeURIComponent(name)}`;
  return base + (base.includes('?') ? '&' : '?') + q;
}

export function connectCollab(token: string, name: string, h: CollabHandlers): CollabSession {
  let ws: WebSocket | null = null;
  let closedByUs = false;
  let retry = 0;
  // limita o envio do doc: o canvas emite a cada micro-mudança
  let pendingDoc: any = null;
  let docTimer: any = null;

  const send = (obj: any) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(obj));
      } catch {}
    }
  };

  const open = () => {
    h.onStatus?.('connecting');
    ws = new WebSocket(wsUrl(token, name));
    ws.onopen = () => {
      retry = 0;
      h.onStatus?.('open');
    };
    ws.onmessage = (ev) => {
      let m: any;
      try {
        m = JSON.parse(ev.data);
      } catch {
        return;
      }
      if (m.t === 'init') h.onInit?.(m.doc, m.peers || [], m.you);
      else if (m.t === 'doc') h.onDoc?.(m.doc);
      else if (m.t === 'peers') h.onPeers?.(m.peers || []);
      else if (m.t === 'cursor') h.onCursor?.(m as RemoteCursor);
    };
    ws.onclose = () => {
      h.onStatus?.('closed');
      if (!closedByUs) {
        const wait = Math.min(6000, 600 * 2 ** retry++);
        setTimeout(open, wait);
      }
    };
    ws.onerror = () => {
      try {
        ws?.close();
      } catch {}
    };
  };
  open();

  return {
    sendDoc: (doc) => {
      // envia no máximo ~a cada 140ms, sempre a versão mais recente
      pendingDoc = doc;
      if (docTimer) return;
      docTimer = setTimeout(() => {
        docTimer = null;
        if (pendingDoc !== null) {
          send({ t: 'doc', doc: pendingDoc });
          pendingDoc = null;
        }
      }, 140);
    },
    sendCursor: (x, y) => send({ t: 'cursor', x, y }),
    close: () => {
      closedByUs = true;
      clearTimeout(docTimer);
      try {
        ws?.close();
      } catch {}
    },
  };
}

/**
 * Junta os cursores remotos e os repassa ao canvas (que os desenha). Mantém o
 * último cursor de cada colega, descarta os que sumiram e poda os parados.
 */
export function makeCursorForwarder(post: (msg: any) => void, intervalMs = 220) {
  const map = new Map<string, RemoteCursor & { ts: number }>();
  let live = new Set<string>();
  const flush = () => {
    const now = Date.now();
    const arr: RemoteCursor[] = [];
    for (const [id, c] of map) {
      if (!live.has(id) || now - c.ts > 4000) {
        map.delete(id);
        continue;
      }
      arr.push({ from: id, name: c.name, color: c.color, x: c.x, y: c.y });
    }
    post({ type: 'archstudio:cursors', cursors: arr });
  };
  const timer = setInterval(flush, intervalMs);
  return {
    onCursor: (c: RemoteCursor) => {
      map.set(c.from, { ...c, ts: Date.now() });
    },
    onPeers: (peers: Peer[]) => {
      live = new Set(peers.map((p) => p.id));
    },
    stop: () => {
      clearInterval(timer);
      map.clear();
      post({ type: 'archstudio:cursors', cursors: [] });
    },
  };
}
