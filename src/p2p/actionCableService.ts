import {
  type Consumer,
  type Subscription,
  createConsumer,
} from "@rails/actioncable";
import type { GameObjectUpdate, PlayerState } from "./types";

export interface ActionCableMessage {
  type: "player_update" | "object_update" | "player_joined" | "player_left";
  data: PlayerState | GameObjectUpdate | { playerId: string };
  senderId: string;
  timestamp: number;
}

export class ActionCableService {
  private consumer: Consumer;
  private subscription: Subscription | null = null;
  private sessionId: string;
  private playerId: string;
  private isConnected = false;
  private callbacks: {
    onPlayerUpdate?: (player: PlayerState) => void;
    onObjectUpdate?: (object: GameObjectUpdate) => void;
    onPlayerJoined?: (playerId: string) => void;
    onPlayerLeft?: (playerId: string) => void;
    onConnectionChange?: (connected: boolean) => void;
  } = {};

  constructor(
    websocketUrl = "ws://localhost:3000/cable",
    sessionId: string,
    playerId: string,
  ) {
    // Create ActionCable consumer
    this.consumer = createConsumer(websocketUrl);
    this.sessionId = sessionId;
    this.playerId = playerId;
  }

  connect(): void {
    if (this.subscription) {
      this.disconnect();
    }

    this.subscription = this.consumer.subscriptions.create(
      {
        channel: "ExperienceChannel",
        session_id: this.sessionId,
        player_id: this.playerId,
      },
      {
        connected: () => {
          console.log("ActionCable: Connected to ExperienceChannel");
          this.isConnected = true;
          this.callbacks.onConnectionChange?.(true);
        },

        disconnected: () => {
          console.log("ActionCable: Disconnected from ExperienceChannel");
          this.isConnected = false;
          this.callbacks.onConnectionChange?.(false);
        },

        received: (message: ActionCableMessage) => {
          this.handleMessage(message);
        },

        rejected: () => {
          console.error("ActionCable: Subscription rejected");
          this.isConnected = false;
          this.callbacks.onConnectionChange?.(false);
        },
      },
    );
  }

  disconnect(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
    this.consumer.disconnect();
    this.isConnected = false;
    this.callbacks.onConnectionChange?.(false);
  }

  // Send player position/rotation updates
  sendPlayerUpdate(playerState: PlayerState): void {
    if (!this.isConnected || !this.subscription) {
      console.warn("ActionCable: Not connected, cannot send player update");
      return;
    }

    this.subscription.perform("player_update", {
      player_state: playerState,
      timestamp: Date.now(),
    });
  }

  // Send object interaction updates
  sendObjectUpdate(objectUpdate: GameObjectUpdate): void {
    if (!this.isConnected || !this.subscription) {
      console.warn("ActionCable: Not connected, cannot send object update");
      return;
    }

    this.subscription.perform("object_update", {
      object_update: objectUpdate,
      timestamp: Date.now(),
    });
  }

  // Handle incoming messages
  private handleMessage(message: ActionCableMessage): void {
    // Don't process our own messages
    if (message.senderId === this.playerId) {
      return;
    }

    switch (message.type) {
      case "player_update":
        this.callbacks.onPlayerUpdate?.(message.data as PlayerState);
        break;
      case "object_update":
        this.callbacks.onObjectUpdate?.(message.data as GameObjectUpdate);
        break;
      case "player_joined":
        this.callbacks.onPlayerJoined?.(
          (message.data as { playerId: string }).playerId,
        );
        break;
      case "player_left":
        this.callbacks.onPlayerLeft?.(
          (message.data as { playerId: string }).playerId,
        );
        break;
      default:
        console.warn("ActionCable: Unknown message type:", message.type);
    }
  }

  // Set event callbacks
  onPlayerUpdate(callback: (player: PlayerState) => void): void {
    this.callbacks.onPlayerUpdate = callback;
  }

  onObjectUpdate(callback: (object: GameObjectUpdate) => void): void {
    this.callbacks.onObjectUpdate = callback;
  }

  onPlayerJoined(callback: (playerId: string) => void): void {
    this.callbacks.onPlayerJoined = callback;
  }

  onPlayerLeft(callback: (playerId: string) => void): void {
    this.callbacks.onPlayerLeft = callback;
  }

  onConnectionChange(callback: (connected: boolean) => void): void {
    this.callbacks.onConnectionChange = callback;
  }

  // Getters
  get connected(): boolean {
    return this.isConnected;
  }

  get currentSessionId(): string {
    return this.sessionId;
  }

  get currentPlayerId(): string {
    return this.playerId;
  }
}
