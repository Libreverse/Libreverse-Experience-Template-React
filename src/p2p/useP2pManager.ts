import { useCallback, useEffect, useRef, useState } from "react";
import P2pPeer, { type P2pPeerContainer } from "./P2pPeer";
import WebSocketSignaling from "./WebSocketSignaling";
import {
  type GameObjectUpdate,
  MessageType,
  type P2pMessage,
  type PlayerState,
  type NegotiationMessage,
} from "./types";

interface DataMessage {
  type: "player_update" | "object_update";
  player?: PlayerState;
  object?: GameObjectUpdate;
}

export interface P2pManagerConfig {
  sessionId: string;
  peerId: string;
  signalingUrl: string;
  iceServers?: RTCIceServer[];
  heartbeatInterval?: number;
  heartbeatTimeout?: number;
}

export interface P2pManagerState {
  isConnected: boolean;
  isHost: boolean;
  connectionState: string;
  connectedPeers: string[];
  players: Map<string, PlayerState>;
  gameObjects: Map<string, GameObjectUpdate>;
}

export function useP2pManager(config: P2pManagerConfig) {
  const [state, setState] = useState<P2pManagerState>({
    isConnected: false,
    isHost: false,
    connectionState: "disconnected",
    connectedPeers: [],
    players: new Map(),
    gameObjects: new Map(),
  });

  const peerRef = useRef<P2pPeer>();
  const signalingRef = useRef<WebSocketSignaling>();
  const messageHandlersRef = useRef<Map<string, (data: unknown) => void>>(
    new Map(),
  );

  // P2P Container implementation
  const containerRef = useRef<P2pPeerContainer>({
    dispatchP2pMessage: (message: P2pMessage) => {
      const handler = messageHandlersRef.current.get(message.type);
      if (handler) {
        handler(message.data);
      }

      // Handle built-in message types
      switch (message.type) {
        case MessageType.Data:
          handleDataMessage(message.data, message.senderId);
          break;
        case MessageType.DataConnectionState:
          handleConnectionStateMessage(message.data as Record<string, string>);
          break;
      }
    },
    p2pNegotiating: () => {
      setState((prev) => ({ ...prev, connectionState: "negotiating" }));
    },
    p2pConnecting: () => {
      setState((prev) => ({ ...prev, connectionState: "connecting" }));
    },
    p2pConnected: () => {
      setState((prev) => ({
        ...prev,
        connectionState: "connected",
        isConnected: true,
      }));
    },
    p2pDisconnected: () => {
      setState((prev) => ({
        ...prev,
        connectionState: "disconnected",
        isConnected: false,
      }));
    },
    p2pClosed: () => {
      setState((prev) => ({
        ...prev,
        connectionState: "closed",
        isConnected: false,
      }));
    },
    p2pError: () => {
      setState((prev) => ({
        ...prev,
        connectionState: "error",
        isConnected: false,
      }));
    },
  });

  const handleDataMessage = useCallback((data: unknown, senderId: string) => {
    const parsedData = data as DataMessage;
    if (parsedData.type === "player_update") {
      setState((prev) => {
        const newPlayers = new Map(prev.players);
        if (parsedData.player) {
          newPlayers.set(senderId, parsedData.player);
        }
        return { ...prev, players: newPlayers };
      });
    } else if (parsedData.type === "object_update") {
      setState((prev) => {
        const newObjects = new Map(prev.gameObjects);
        if (parsedData.object) {
          newObjects.set(parsedData.object.id, parsedData.object);
        }
        return { ...prev, gameObjects: newObjects };
      });
    }
  }, []);

  const handleConnectionStateMessage = useCallback(
    (connectionStatus: Record<string, string>) => {
      const connectedPeers = Object.keys(connectionStatus).filter(
        (peerId) => connectionStatus[peerId] === "connected",
      );
      setState((prev) => ({ ...prev, connectedPeers }));
    },
    [],
  );

  const connect = useCallback(() => {
    if (peerRef.current) {
      return; // Already connected
    }

    const signaling = new WebSocketSignaling(
      config.sessionId,
      config.peerId,
      config.signalingUrl,
    );
    signalingRef.current = signaling;

    const iceConfig = {
      iceServers: config.iceServers || [
        { urls: ["stun:stun.l.google.com:19302"] },
      ],
    };

    const heartbeatConfig = {
      interval_mls: config.heartbeatInterval || 30000,
      idle_timeout_mls: config.heartbeatTimeout || 60000,
    };

    const peer = new P2pPeer(
      config.sessionId,
      config.peerId,
      containerRef.current,
      signaling,
      iceConfig,
      heartbeatConfig,
    );

    peerRef.current = peer;

    // Set up signaling message handler
    signaling.setMessageHandler((message) => {
      const messageData = message as { type: string; [key: string]: unknown };
      if (messageData.type === "Connection") {
        peer.negotiate(message as unknown as NegotiationMessage);
      }
    });

    // Set host status
    setState((prev) => ({ ...prev, isHost: peer.iamHost }));

    peer.setup();
  }, [config]);

  const disconnect = useCallback(() => {
    if (signalingRef.current) {
      signalingRef.current.disconnect();
      signalingRef.current = undefined;
    }
    peerRef.current = undefined;
    setState({
      isConnected: false,
      isHost: false,
      connectionState: "disconnected",
      connectedPeers: [],
      players: new Map(),
      gameObjects: new Map(),
    });
  }, []);

  const sendMessage = useCallback((data: DataMessage) => {
    if (peerRef.current) {
      peerRef.current.sendP2pMessage(data);
    }
  }, []);

  const sendPlayerUpdate = useCallback(
    (player: PlayerState) => {
      sendMessage({
        type: "player_update",
        player,
      });
    },
    [sendMessage],
  );

  const sendObjectUpdate = useCallback(
    (object: GameObjectUpdate) => {
      sendMessage({
        type: "object_update",
        object,
      });
    },
    [sendMessage],
  );

  const addMessageHandler = useCallback(
    (type: string, handler: (data: unknown) => void) => {
      messageHandlersRef.current.set(type, handler);
    },
    [],
  );

  const removeMessageHandler = useCallback((type: string) => {
    messageHandlersRef.current.delete(type);
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    state,
    connect,
    disconnect,
    sendMessage,
    sendPlayerUpdate,
    sendObjectUpdate,
    addMessageHandler,
    removeMessageHandler,
  };
}
