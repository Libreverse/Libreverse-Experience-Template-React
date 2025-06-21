import type { SignalingChannel } from "./P2pPeer";

export default class WebSocketSignaling implements SignalingChannel {
  private ws?: WebSocket;
  private sessionId: string;
  private peerId: string;
  private onMessage?: (message: unknown) => void;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(sessionId: string, peerId: string, signalingUrl: string) {
    this.sessionId = sessionId;
    this.peerId = peerId;
    this.connect(signalingUrl);
  }

  private connect(url: string) {
    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log("WebSocket signaling connected");
        this.reconnectAttempts = 0;
        // Join session on connect
        this.send({
          type: "join",
          sessionId: this.sessionId,
          peerId: this.peerId,
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (this.onMessage) {
            this.onMessage(message);
          }
        } catch (error) {
          console.error("Failed to parse signaling message:", error);
        }
      };

      this.ws.onclose = () => {
        console.log("WebSocket signaling disconnected");
        this.attemptReconnect(url);
      };

      this.ws.onerror = (error) => {
        console.error("WebSocket signaling error:", error);
      };
    } catch (error) {
      console.error("Failed to connect to signaling server:", error);
      this.attemptReconnect(url);
    }
  }

  private attemptReconnect(url: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(
        `Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`,
      );
      setTimeout(() => {
        this.connect(url);
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error("Max reconnection attempts reached");
    }
  }

  send(message: unknown): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket not connected, message not sent:", message);
    }
  }

  setMessageHandler(handler: (message: unknown) => void) {
    this.onMessage = handler;
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = undefined;
    }
  }
}
