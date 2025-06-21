import {
  ConnectionState,
  MessageType,
  type P2pMessage,
  type P2pPeerInterface,
  type HeartbeatConfig,
} from "./types";

const ICE_CONFIG = {
  iceServers: [
    {
      urls: [
        "stun:stun.l.google.com:19302",
        "stun:stun1.l.google.com:19302",
        "stun:stun2.l.google.com:19302",
      ],
    },
  ],
};

export default class P2pConnection {
  peer: P2pPeerInterface;
  clientId: string;
  hostId: string;
  iamHost: boolean;
  state: string;
  lastTimeUpdate: number;
  iceConfig: RTCConfiguration;
  heartbeatConfig: HeartbeatConfig | undefined;
  rtcPeerConnection?: RTCPeerConnection;
  sendDataChannel?: RTCDataChannel;
  receiveDataChannel?: RTCDataChannel;
  sendDataChannelOpen: boolean;
  heartbeat?: NodeJS.Timeout;

  constructor(
    peer: P2pPeerInterface,
    clientId: string,
    hostId: string,
    iamHost: boolean,
    iceConfig?: RTCConfiguration,
    heartbeatConfig?: HeartbeatConfig,
  ) {
    this.peer = peer;
    this.clientId = clientId;
    this.hostId = hostId;
    this.iamHost = iamHost;
    this.state = ConnectionState.New;
    this.lastTimeUpdate = 0;
    this.iceConfig = iceConfig || ICE_CONFIG;
    this.heartbeatConfig = heartbeatConfig;
    this.sendDataChannelOpen = false;
  }

  setupRTCPeerConnection() {
    this.rtcPeerConnection = new RTCPeerConnection(this.iceConfig);

    this.rtcPeerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        const ice: Record<string, RTCIceCandidate> = {};
        ice[ConnectionState.IceCandidate] = event.candidate;
        this.peer.signal(ConnectionState.IceCandidate, ice);
      }
    };

    this.rtcPeerConnection.onconnectionstatechange = () => {
      if (this.rtcPeerConnection) {
        this.state = this.rtcPeerConnection.connectionState;
        if (
          this.state === ConnectionState.DisConnected ||
          this.state === ConnectionState.Closed
        ) {
          this.close();
        }
        this.peer.updateP2pConnectionState(this);
      }
    };

    this.sendDataChannel =
      this.rtcPeerConnection.createDataChannel("sendChannel");
    this.sendDataChannel.onopen = this.handleSendChannelStatusChange.bind(this);
    this.sendDataChannel.onclose =
      this.handleSendChannelStatusChange.bind(this);

    this.rtcPeerConnection.ondatachannel = (event) => {
      this.receiveDataChannel = event.channel;
      this.receiveDataChannel.onmessage = this.receiveP2pMessage.bind(this);
      this.receiveDataChannel.onopen =
        this.handleReceiveChannelStatusChange.bind(this);
      this.receiveDataChannel.onclose =
        this.handleReceiveChannelStatusChange.bind(this);

      this.peer.updateP2pConnectionState(this);
    };

    return this.rtcPeerConnection;
  }

  receiveP2pMessage(event: MessageEvent) {
    const msg = JSON.parse(event.data) as P2pMessage;
    switch (msg.type) {
      case MessageType.Heartbeat:
        this.state = ConnectionState.Connected;
        this.lastTimeUpdate = Date.now();
        break;
      default:
        this.peer.receivedP2pMessage(msg);
        break;
    }
  }

  sendP2pMessage(message: unknown, type = MessageType.Data, senderId?: string) {
    if (this.sendDataChannel && this.sendDataChannelOpen) {
      const msgJson = JSON.stringify({
        type: type,
        senderId: senderId || this.peer.peerId,
        data: message,
      });
      this.sendDataChannel.send(msgJson);
    }
  }

  handleSendChannelStatusChange() {
    if (this.sendDataChannel) {
      this.sendDataChannelOpen = this.sendDataChannel.readyState === "open";
      if (this.sendDataChannelOpen && this.heartbeatConfig) {
        this.scheduleHeartbeat();
      }
    }
  }

  handleReceiveChannelStatusChange() {
    // Channel status change handling
  }

  scheduleHeartbeat() {
    if (this.heartbeatConfig) {
      this.heartbeat = setTimeout(() => {
        this.sendHeartbeat();
      }, this.heartbeatConfig.interval_mls);
    }
  }

  sendHeartbeat() {
    if (
      this.heartbeatConfig &&
      this.lastTimeUpdate > 0 &&
      Date.now() - this.lastTimeUpdate > this.heartbeatConfig.idle_timeout_mls
    ) {
      this.state = ConnectionState.DisConnected;
      this.peer.updateP2pConnectionState(this);
    } else {
      this.sendP2pMessage("ping", MessageType.Heartbeat);
      this.scheduleHeartbeat();
    }
  }

  stopHeartbeat() {
    if (this.heartbeat) {
      clearTimeout(this.heartbeat);
    }
  }

  close() {
    this.stopHeartbeat();
  }
}
