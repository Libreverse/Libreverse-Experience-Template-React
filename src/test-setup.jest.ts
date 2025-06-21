import "@testing-library/jest-dom";

// Mock Three.js for testing
jest.mock("three", () => ({
  Vector3: jest.fn().mockImplementation((x = 0, y = 0, z = 0) => ({
    x,
    y,
    z,
    set: jest.fn(),
    add: jest.fn(),
    sub: jest.fn(),
    normalize: jest.fn().mockReturnThis(),
    multiplyScalar: jest.fn().mockReturnThis(),
    lengthSq: jest.fn(() => 1),
    crossVectors: jest.fn().mockReturnThis(),
    getWorldDirection: jest.fn(),
  })),
  Mesh: jest.fn(),
  Camera: jest.fn(),
  Scene: jest.fn(),
  WebGLRenderer: jest.fn(),
  PerspectiveCamera: jest.fn(),
  Object3D: jest.fn(),
}));

// Mock React Three Fiber
jest.mock("@react-three/fiber", () => {
  const mockReact = require("react");
  return {
    Canvas: ({ children }: { children: any }) => {
      return mockReact.createElement(
        "div",
        { "data-testid": "canvas" },
        children,
      );
    },
    useFrame: jest.fn(),
    useThree: jest.fn(() => ({
      camera: {
        position: { set: jest.fn() },
        rotation: { x: 0, y: 0, z: 0 },
        getWorldDirection: jest.fn(),
      },
      scene: {},
      gl: { domElement: null },
    })),
  };
});

// Mock React Three Cannon
jest.mock("@react-three/cannon", () => {
  const mockReact = require("react");
  return {
    Physics: ({ children }: { children: any }) => {
      return mockReact.createElement(
        "div",
        { "data-testid": "physics" },
        children,
      );
    },
    useBox: jest.fn(() => [
      { current: null },
      {
        position: { set: jest.fn() },
        rotation: { set: jest.fn() },
      },
    ]),
    useSphere: jest.fn(() => [
      { current: null },
      {
        position: { set: jest.fn() },
        rotation: { set: jest.fn() },
      },
    ]),
    usePlane: jest.fn(() => [{ current: null }, {}]),
  };
});

// Mock React Three Drei
jest.mock("@react-three/drei", () => {
  const mockReact = require("react");
  return {
    PointerLockControls: jest.fn(() =>
      mockReact.createElement("div", {
        "data-testid": "pointer-lock-controls",
      }),
    ),
    Grid: jest.fn(() =>
      mockReact.createElement("div", { "data-testid": "grid" }),
    ),
    Text: ({ children }: { children: any }) =>
      mockReact.createElement("div", { "data-testid": "text" }, children),
    Html: ({ children }: { children: any }) =>
      mockReact.createElement("div", { "data-testid": "html" }, children),
  };
});

// Mock React Three XR
jest.mock("@react-three/xr", () => {
  const mockReact = require("react");
  return {
    XR: ({ children }: { children: any }) => {
      return mockReact.createElement("div", { "data-testid": "xr" }, children);
    },
    XRButton: jest.fn(() =>
      mockReact.createElement(
        "button",
        { "data-testid": "xr-button", type: "button" },
        "Enter VR",
      ),
    ),
    Interactive: ({ children }: { children: any }) => {
      return mockReact.createElement(
        "div",
        { "data-testid": "interactive" },
        children,
      );
    },
    useXR: jest.fn(() => ({
      isPresenting: false,
      player: {
        position: [0, 0, 0],
        rotation: [0, 0, 0],
      },
    })),
    useController: jest.fn(() => ({
      controller: null,
      grip: null,
    })),
  };
});

// Mock ActionCable
jest.mock("@rails/actioncable", () => ({
  createConsumer: jest.fn(() => ({
    subscriptions: {
      create: jest.fn(() => ({
        send: jest.fn(),
        unsubscribe: jest.fn(),
      })),
    },
    disconnect: jest.fn(),
  })),
}));

// Mock WebSocket
(global as any).WebSocket = jest.fn().mockImplementation(() => ({
  send: jest.fn(),
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  readyState: 1, // OPEN
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
}));

// Mock RTCPeerConnection
(global as any).RTCPeerConnection = jest.fn().mockImplementation(() => ({
  createOffer: jest.fn().mockResolvedValue({}),
  createAnswer: jest.fn().mockResolvedValue({}),
  setLocalDescription: jest.fn().mockResolvedValue(undefined),
  setRemoteDescription: jest.fn().mockResolvedValue(undefined),
  addIceCandidate: jest.fn().mockResolvedValue(undefined),
  createDataChannel: jest.fn().mockReturnValue({
    send: jest.fn(),
    close: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    readyState: "open",
  }),
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  connectionState: "new",
  iceConnectionState: "new",
  iceGatheringState: "new",
  signalingState: "stable",
}));

// Mock MediaDevices
Object.defineProperty(navigator, "mediaDevices", {
  writable: true,
  value: {
    getUserMedia: jest.fn().mockResolvedValue({
      getTracks: jest.fn().mockReturnValue([]),
    }),
  },
});

// Mock Canvas API
HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue({
  fillRect: jest.fn(),
  clearRect: jest.fn(),
  getImageData: jest.fn(() => ({ data: new Array(4) })),
  putImageData: jest.fn(),
  createImageData: jest.fn(() => ({ data: new Array(4) })),
  setTransform: jest.fn(),
  drawImage: jest.fn(),
  save: jest.fn(),
  fillText: jest.fn(),
  restore: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  closePath: jest.fn(),
  stroke: jest.fn(),
  translate: jest.fn(),
  scale: jest.fn(),
  rotate: jest.fn(),
  arc: jest.fn(),
  fill: jest.fn(),
  measureText: jest.fn(() => ({ width: 0 })),
  transform: jest.fn(),
  rect: jest.fn(),
  clip: jest.fn(),
});
