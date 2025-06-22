// Simple WebSocket relay server for local multiplayer dev (TypeScript)
// Usage: ts-node dev-server.ts

import { WebSocketServer, WebSocket } from "ws";

const PORT = 42424;
const wss = new WebSocketServer({ port: PORT });

// Map: sessionId -> Set of clients
const sessions = new Map<string, Set<WebSocket>>();

wss.on("connection", (ws: WebSocket) => {
  let sessionId: string | null = null;

  ws.on("message", (msg: string) => {
    try {
      const data = JSON.parse(msg);
      if (
        data.type === "join" &&
        typeof data.sessionId === "string" &&
        data.peerId
      ) {
        sessionId = data.sessionId;
        if (!sessionId) return; // Defensive, but should never happen
        if (!sessions.has(sessionId)) sessions.set(sessionId, new Set());
        sessions.get(sessionId)!.add(ws);
        return;
      }
      // Relay all other messages to all peers in the session except sender
      if (!sessionId || !sessions.has(sessionId)) return;
      for (const client of sessions.get(sessionId)!) {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(msg);
        }
      }
    } catch {
      // Ignore malformed
    }
  });

  ws.on("close", () => {
    if (sessionId && sessions.has(sessionId)) {
      sessions.get(sessionId)!.delete(ws);
      if (sessions.get(sessionId)!.size === 0) sessions.delete(sessionId);
    }
  });
});

console.log(`Dev multiplayer relay running on ws://localhost:${PORT}`);
