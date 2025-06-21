import { ActionCableService } from "./actionCableService";
import type { GameObjectUpdate, PlayerState } from "./types";

// Message types for handlers
export type P2PMessage =
  | { type: "player_update"; player: PlayerState }
  | { type: "object_update"; object: GameObjectUpdate };

// Utility to get session/peer ID from URL or generate new
function getSessionAndPeerId() {
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
  return { sessionId, peerId };
}

// Simple P2P client using ActionCable for demo
class LibreverseP2P {
  private service: ActionCableService;
  private handlers: Set<(data: P2PMessage) => void> = new Set();
  public connected = false;
  public peerId: string;
  public isHost: boolean;

  constructor(websocketUrl: string) {
    const { sessionId, peerId } = getSessionAndPeerId();
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
    if (data.type === "player_update") {
      this.service.sendPlayerUpdate(data.player);
    } else if (data.type === "object_update") {
      this.service.sendObjectUpdate(data.object);
    }
  }

  addMessageHandler(handler: (data: P2PMessage) => void) {
    this.handlers.add(handler);
  }
}

// Attach to window if multiplayer is enabled
const isMultiplayer = !window.location.href.includes("offline_available=true");
if (isMultiplayer) {
  (window as unknown as { P2P: LibreverseP2P }).P2P = new LibreverseP2P(
    "ws://localhost:3000/cable",
  );
}

export {};
