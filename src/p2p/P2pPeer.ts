import P2pConnection from "./P2pConnection";
import {
  ConnectionState,
  MessageType,
  type P2pMessage,
  type HeartbeatConfig,
  type NegotiationMessage,
} from "./types";

export interface SignalingChannel {
  send(message: unknown): void;
}

export interface P2pPeerContainer {
  dispatchP2pMessage(message: P2pMessage): void;
  p2pNegotiating(): void;
  p2pConnecting(): void;
  p2pConnected(): void;
  p2pDisconnected(): void;
  p2pClosed(): void;
  p2pError(): void;
}

export default class P2pPeer {
  sessionId: string;
  peerId: string;
  container: P2pPeerContainer;
  signaling: SignalingChannel;
  iceConfig: RTCConfiguration;
  heartbeatConfig: HeartbeatConfig | undefined;
  hostPeerId?: string;
  iamHost: boolean;
  state?: string;
  connections: Map<string, P2pConnection>;
  connectionStatus?: Record<string, string>;

  constructor(
    sessionId: string,
    peerId: string,
    container: P2pPeerContainer,
    signaling: SignalingChannel,
    iceConfig: RTCConfiguration,
    heartbeatConfig?: HeartbeatConfig,
  ) {
    this.sessionId = sessionId;
    this.container = container;
    this.signaling = signaling;
    this.iceConfig = iceConfig;
    this.heartbeatConfig = heartbeatConfig;
    this.peerId = peerId;
    this.hostPeerId = undefined;
    this.iamHost = false;
    this.state = undefined;
    this.connections = new Map();
  }

  setup() {
    this.connections = new Map();
    this.signal(ConnectionState.SessionJoin, {});
    this.dispatchConnectionState(ConnectionState.Negotiating);
  }

  signal(state: ConnectionState, data: Record<string, unknown> | unknown) {
    const msg = {
      type: MessageType.Connection,
      session_id: this.sessionId,
      peer_id: this.peerId,
      state: state,
      ...(typeof data === "object" && data !== null
        ? (data as Record<string, unknown>)
        : {}),
    };
    this.signaling.send(msg);
  }

  negotiate(msg: NegotiationMessage) {
    switch (msg.state) {
      case ConnectionState.SessionJoin:
        break;
      case ConnectionState.SessionReady:
        if (msg.host_peer_id === this.peerId) {
          // I am host
          this.iamHost = true;
          this.hostPeerId = this.peerId;
          if (msg.peer_id === this.peerId) {
            this.updateP2pConnectionState();
            return;
          }

          if (!msg.peer_id) return;

          const connection = new P2pConnection(
            this,
            msg.peer_id,
            this.peerId,
            this.iamHost,
            this.iceConfig,
            this.heartbeatConfig,
          );
          if (msg.peer_id) {
            this.connections.set(msg.peer_id, connection);
          }

          const rtcPeerConnection = connection.setupRTCPeerConnection();
          if (!rtcPeerConnection) {
            return;
          }
          rtcPeerConnection
            .createOffer()
            .then((offer) => {
              return rtcPeerConnection.setLocalDescription(offer);
            })
            .then(() => {
              const offer: Record<string, unknown> = {
                host_peer_id: msg.host_peer_id,
              };
              offer[ConnectionState.SdpOffer] = JSON.stringify(
                rtcPeerConnection.localDescription,
              );
              this.signal(ConnectionState.SdpOffer, offer);
            })
            .catch((err) => console.log(err));
        }

        this.state = ConnectionState.SessionReady;
        break;

      case ConnectionState.SdpOffer:
        if (
          msg.host_peer_id !== this.peerId &&
          this.state !== ConnectionState.SdpOffer
        ) {
          // I am not host
          if (!msg.host_peer_id) return;

          this.hostPeerId = msg.host_peer_id;
          const connection = new P2pConnection(
            this,
            this.peerId,
            msg.host_peer_id,
            this.iamHost,
            this.iceConfig,
            this.heartbeatConfig,
          );
          this.connections.set(this.peerId, connection);

          const rtcPeerConnection = connection.setupRTCPeerConnection();
          if (!rtcPeerConnection) return;

          if (!msg[ConnectionState.SdpOffer]) return;
          const offer = JSON.parse(msg[ConnectionState.SdpOffer]);
          rtcPeerConnection
            .setRemoteDescription(new RTCSessionDescription(offer))
            .then(() => {
              return rtcPeerConnection.createAnswer();
            })
            .then((answer) => {
              return rtcPeerConnection.setLocalDescription(answer);
            })
            .then(() => {
              const answer: Record<string, unknown> = {
                host_peer_id: msg.host_peer_id,
              };
              answer[ConnectionState.SdpAnswer] = JSON.stringify(
                rtcPeerConnection.localDescription,
              );
              this.signal(ConnectionState.SdpAnswer, answer);
            })
            .catch((err) => console.log(err));
        }
        break;

      case ConnectionState.SdpAnswer:
        if (msg.host_peer_id === this.peerId) {
          // I am host
          if (!msg.peer_id) return;
          const clientConnection = this.connections.get(msg.peer_id);
          if (!clientConnection) return;

          const rtcPeerConnection = clientConnection.rtcPeerConnection;
          if (!rtcPeerConnection) return;

          if (!msg[ConnectionState.SdpAnswer]) return;
          const answer = JSON.parse(msg[ConnectionState.SdpAnswer]);
          rtcPeerConnection
            .setRemoteDescription(new RTCSessionDescription(answer))
            .catch((err) => console.log(err));
        }
        break;

      case ConnectionState.IceCandidate:
        if (msg[ConnectionState.IceCandidate]) {
          this.connections.forEach((connection) => {
            if (connection.rtcPeerConnection) {
              connection.rtcPeerConnection
                .addIceCandidate(
                  new RTCIceCandidate(msg[ConnectionState.IceCandidate]),
                )
                .catch((err) => console.log(err));
            }
          });
        }
        break;

      case ConnectionState.Error:
        break;

      default:
        break;
    }
  }

  dispatchP2pMessage(message: unknown, type: MessageType, senderId: string) {
    this.connections.forEach((connection) => {
      connection.sendP2pMessage(message, type, senderId);
    });
  }

  sendP2pMessage(message: unknown) {
    if (this.iamHost) {
      this.container.dispatchP2pMessage({
        type: MessageType.Data,
        senderId: this.peerId,
        data: message,
      });
    }

    this.connections.forEach((connection) => {
      connection.sendP2pMessage(message, MessageType.Data, this.peerId);
    });
  }

  receivedP2pMessage(message: unknown) {
    const p2pMessage = message as P2pMessage;
    switch (p2pMessage.type) {
      case MessageType.Data:
      case MessageType.DataConnectionState:
        if (this.iamHost) {
          //broadcast to all connections
          this.dispatchP2pMessage(
            p2pMessage.data,
            p2pMessage.type,
            p2pMessage.senderId,
          );
        }

        // dispatch msg to container
        this.container.dispatchP2pMessage(p2pMessage);
        break;
      default:
        break;
    }
  }

  updateP2pConnectionState(connection?: unknown) {
    if (this.iamHost) {
      this.connectionStatus = this.connectionStatus || {};
      this.connections.forEach((connection, peerId) => {
        if (this.connectionStatus) {
          this.connectionStatus[peerId] = connection.state;
        }
      });
      if (this.connectionStatus && this.hostPeerId) {
        this.connectionStatus[this.hostPeerId] = ConnectionState.Connected;
      }

      this.container.dispatchP2pMessage({
        type: MessageType.DataConnectionState,
        senderId: this.peerId,
        data: this.connectionStatus,
      });

      if (this.connectionStatus) {
        this.dispatchP2pMessage(
          this.connectionStatus,
          MessageType.DataConnectionState,
          this.hostPeerId || this.peerId,
        );
      }
    }

    if (connection) {
      this.dispatchP2pConnectionState(connection as P2pConnection);
    }
  }

  dispatchP2pConnectionState(connection: P2pConnection) {
    switch (connection.state) {
      case ConnectionState.Negotiating:
        this.container.p2pNegotiating();
        break;
      case ConnectionState.Connecting:
        this.container.p2pConnecting();
        break;
      case ConnectionState.Connected:
        this.container.p2pConnected();
        break;
      case ConnectionState.DisConnected:
        this.container.p2pDisconnected();
        break;
      case ConnectionState.Closed:
        this.container.p2pClosed();
        break;
      case ConnectionState.Failed:
        this.container.p2pError();
        break;
      default:
        break;
    }
  }

  dispatchConnectionState(state: ConnectionState) {
    switch (state) {
      case ConnectionState.Negotiating:
        this.container.p2pNegotiating();
        break;
      case ConnectionState.Connecting:
        this.container.p2pConnecting();
        break;
      case ConnectionState.Connected:
        this.container.p2pConnected();
        break;
      case ConnectionState.DisConnected:
        this.container.p2pDisconnected();
        break;
      case ConnectionState.Closed:
        this.container.p2pClosed();
        break;
      default:
        this.container.p2pError();
        break;
    }
  }
}
