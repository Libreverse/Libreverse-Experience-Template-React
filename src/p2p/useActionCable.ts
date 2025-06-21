import { useCallback, useEffect, useRef, useState } from "react";
import { ActionCableService } from "./actionCableService";
import type { GameObjectUpdate, PlayerState } from "./types";

interface UseActionCableOptions {
  websocketUrl?: string;
  sessionId: string;
  playerId: string;
  autoConnect?: boolean;
}

interface UseActionCableReturn {
  // Connection state
  isConnected: boolean;

  // Connection methods
  connect: () => void;
  disconnect: () => void;

  // Messaging methods
  sendPlayerUpdate: (playerState: PlayerState) => void;
  sendObjectUpdate: (objectUpdate: GameObjectUpdate) => void;

  // Remote players and objects
  remotePlayers: Map<string, PlayerState>;
  remoteObjects: Map<string, GameObjectUpdate>;

  // Service instance (for advanced usage)
  service: ActionCableService | null;
}

export function useActionCable({
  websocketUrl = "ws://localhost:3000/cable",
  sessionId,
  playerId,
  autoConnect = true,
}: UseActionCableOptions): UseActionCableReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [remotePlayers, setRemotePlayers] = useState<Map<string, PlayerState>>(
    new Map(),
  );
  const [remoteObjects, setRemoteObjects] = useState<
    Map<string, GameObjectUpdate>
  >(new Map());

  const serviceRef = useRef<ActionCableService | null>(null);

  // Initialize service
  useEffect(() => {
    if (!serviceRef.current) {
      serviceRef.current = new ActionCableService(
        websocketUrl,
        sessionId,
        playerId,
      );

      // Set up event handlers
      serviceRef.current.onConnectionChange((connected) => {
        setIsConnected(connected);
      });

      serviceRef.current.onPlayerUpdate((player) => {
        setRemotePlayers((prev) => {
          const next = new Map(prev);
          next.set(player.id, player);
          return next;
        });
      });

      serviceRef.current.onObjectUpdate((object) => {
        setRemoteObjects((prev) => {
          const next = new Map(prev);
          next.set(object.id, object);
          return next;
        });
      });

      serviceRef.current.onPlayerJoined((playerId) => {
        console.log(`Player joined: ${playerId}`);
      });

      serviceRef.current.onPlayerLeft((playerId) => {
        console.log(`Player left: ${playerId}`);
        setRemotePlayers((prev) => {
          const next = new Map(prev);
          next.delete(playerId);
          return next;
        });
      });
    }

    return () => {
      if (serviceRef.current) {
        serviceRef.current.disconnect();
      }
    };
  }, [websocketUrl, sessionId, playerId]);

  // Auto-connect
  useEffect(() => {
    if (autoConnect && serviceRef.current && !isConnected) {
      serviceRef.current.connect();
    }
  }, [autoConnect, isConnected]);

  // Connection methods
  const connect = useCallback(() => {
    serviceRef.current?.connect();
  }, []);

  const disconnect = useCallback(() => {
    serviceRef.current?.disconnect();
  }, []);

  // Messaging methods
  const sendPlayerUpdate = useCallback((playerState: PlayerState) => {
    serviceRef.current?.sendPlayerUpdate(playerState);
  }, []);

  const sendObjectUpdate = useCallback((objectUpdate: GameObjectUpdate) => {
    serviceRef.current?.sendObjectUpdate(objectUpdate);
  }, []);

  return {
    isConnected,
    connect,
    disconnect,
    sendPlayerUpdate,
    sendObjectUpdate,
    remotePlayers,
    remoteObjects,
    service: serviceRef.current,
  };
}
