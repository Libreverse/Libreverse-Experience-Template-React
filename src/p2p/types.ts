export enum ConnectionState {
  SessionJoin = "SessionJoin",
  SessionReady = "SessionReady",
  SdpOffer = "SdpOffer",
  SdpAnswer = "SdpAnswer",
  IceCandidate = "IceCandidate",
  Error = "Error",
  New = "new",
  Negotiating = "negotiating",
  Connecting = "connecting",
  Connected = "connected",
  DisConnected = "disconnected",
  Closed = "closed",
  Failed = "failed",
}

export enum MessageType {
  Connection = "Connection",
  Heartbeat = "Heartbeat",
  Data = "Data",
  DataConnectionState = "Data.Connection.State",
}

export interface P2pMessage {
  type: MessageType;
  senderId: string;
  data: unknown;
}

export interface PlayerState {
  id: string;
  position: [number, number, number];
  rotation: [number, number, number];
  color: string;
  name: string;
}

export interface GameObjectUpdate {
  id: string;
  type: "box" | "sphere";
  position: [number, number, number];
  rotation: [number, number, number];
  scale?: number;
  color?: string;
  interaction?: {
    type: "grab" | "release" | "hover";
    playerId: string;
  };
}

export interface P2pConfig {
  iceServers: RTCIceServer[];
  heartbeat: {
    interval_mls: number;
    idle_timeout_mls: number;
  };
}

export interface HeartbeatConfig {
  interval_mls: number;
  idle_timeout_mls: number;
}

export interface P2pPeerInterface {
  peerId: string;
  signal: (state: ConnectionState, data: unknown) => void;
  updateP2pConnectionState: (connection?: unknown) => void;
  receivedP2pMessage: (message: unknown) => void;
}

export interface NegotiationMessage {
  state: ConnectionState;
  host_peer_id?: string;
  peer_id?: string;
  [ConnectionState.SdpOffer]?: string;
  [ConnectionState.SdpAnswer]?: string;
  [ConnectionState.IceCandidate]?: RTCIceCandidate;
  [key: string]: unknown;
}
