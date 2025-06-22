// LibreverseP2P: Unified multiplayer interface for both iframe (prod) and dev
import { ActionCableService } from "./actionCableService";
import type { GameObjectUpdate, PlayerState } from "./types";

// Use a loose message type for compatibility with app
export type P2PMessage = {
  type: string;
  player?: PlayerState;
  object?: GameObjectUpdate;
};

// Mock implementation for dev (not in iframe)
class MockP2P {
  private handlers: Set<(data: P2PMessage) => void> = new Set();
  public connected = true;
  public peerId: string;
  public isHost: boolean;
  private static peers: MockP2P[] = [];

  constructor() {
    this.peerId = `peer_${Math.random().toString(36).substr(2, 9)}`;
    this.isHost = MockP2P.peers.length === 0;
    MockP2P.peers.push(this);
    setTimeout(() => {
      this.connected = true;
      this.broadcast({
        type: "player_update",
        player: {
          id: this.peerId,
          position: [0, 1, 5],
          rotation: [0, 0, 0],
          color: "#888888",
          name: this.peerId,
        },
      });
    }, 100);
  }

  send(data: P2PMessage) {
    this.broadcast(data);
  }

  addMessageHandler(handler: (data: P2PMessage) => void) {
    this.handlers.add(handler);
  }

  private broadcast(data: P2PMessage) {
    for (const peer of MockP2P.peers) {
      peer.handlers.forEach((h) => h(data));
    }
  }
}

// ActionCable-based implementation for prod (when not in iframe, but needed for real backend)
class ActionCableP2P {
  private service: ActionCableService;
  private handlers: Set<(data: P2PMessage) => void> = new Set();
  public connected = false;
  public peerId: string;
  public isHost: boolean;

  constructor(websocketUrl: string) {
    // Utility to get session/peer ID from URL or generate new
    const url = new URL(window.location.href);
    let sessionId = url.searchParams.get("session");
    if (!sessionId) {
      sessionId = `session_${Math.random().toString(36).substr(2, 9)}`;
      url.searchParams.set("session", sessionId);
      window.history.replaceState({}, "", url.toString());
    }
    let peerId = localStorage.getItem("peerId");
    if (!peerId) {
      peerId = `peer_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("peerId", peerId);
    }
    this.peerId = peerId;
    this.isHost = false; // Host logic can be improved if needed
    this.service = new ActionCableService(websocketUrl, sessionId, peerId);
    this.service.onConnectionChange((connected) => {
      this.connected = connected;
    });
    this.service.onPlayerUpdate((player) => {
      this.handlers.forEach((h) => h({ type: "player_update", player }));
    });
    this.service.onObjectUpdate((object) => {
      this.handlers.forEach((h) => h({ type: "object_update", object }));
    });
    this.service.connect();
  }

  send(data: P2PMessage) {
    if (data.type === "player_update" && data.player) {
      this.service.sendPlayerUpdate(data.player);
    } else if (data.type === "object_update" && data.object) {
      this.service.sendObjectUpdate(data.object);
    }
  }

  addMessageHandler(handler: (data: P2PMessage) => void) {
    this.handlers.add(handler);
  }
}

// WebSocket-based P2P for dev backend
class DevWebSocketP2P implements LibreverseP2PInterface {
  private ws: WebSocket | null = null;
  private handlers: Set<(data: P2PMessage) => void> = new Set();
  public connected = false;
  public peerId: string;
  public isHost: boolean;
  private sessionId: string;

  constructor() {
    // Get or generate session/peer ID
    const url = new URL(window.location.href);
    let sessionId = url.searchParams.get("session");
    if (!sessionId) {
      sessionId = `session_${Math.random().toString(36).substr(2, 9)}`;
      url.searchParams.set("session", sessionId);
      window.history.replaceState({}, "", url.toString());
    }
    let peerId = localStorage.getItem("peerId");
    if (!peerId) {
      peerId = `peer_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("peerId", peerId);
    }
    this.peerId = peerId;
    this.sessionId = sessionId;
    this.isHost = false;
    this.connect();
  }

  private connect() {
    this.ws = new window.WebSocket("ws://localhost:42424");
    this.ws.onopen = () => {
      this.connected = true;
      this.ws?.send(
        JSON.stringify({
          type: "join",
          sessionId: this.sessionId,
          peerId: this.peerId,
        }),
      );
    };
    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handlers.forEach((h) => h(data));
      } catch {}
    };
    this.ws.onclose = () => {
      this.connected = false;
    };
    this.ws.onerror = () => {
      this.connected = false;
    };
  }

  send(data: P2PMessage) {
    if (this.ws && this.ws.readyState === window.WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  addMessageHandler(handler: (data: P2PMessage) => void) {
    this.handlers.add(handler);
  }
}

// Type for the P2P interface
export interface LibreverseP2PInterface {
  send: (data: P2PMessage) => void;
  addMessageHandler: (handler: (data: P2PMessage) => void) => void;
  connected: boolean;
  peerId: string;
  isHost: boolean;
}

declare global {
  interface Window {
    P2P?: LibreverseP2PInterface;
  }
}

// Unified attach logic
function attachP2P() {
  if (typeof window !== "undefined" && window.P2P) {
    // Already provided by backend (iframe/prod)
    return;
  }
  const isDev = !("production" === process.env.NODE_ENV);
  if (isDev) {
    if ("WebSocket" in window) {
      (window as any).P2P = new DevWebSocketP2P();
    } else {
      (window as any).P2P = new MockP2P();
    }
  } else {
    (window as any).P2P = new ActionCableP2P("ws://localhost:3000/cable");
  }
}

attachP2P();

export {};
