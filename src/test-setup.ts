// Bun test setup file for DOM environment and mocks
import { JSDOM } from "jsdom";

// Setup DOM environment for testing
const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
  url: "http://localhost",
  pretendToBeVisual: true,
  resources: "usable",
});

// Assign DOM globals
Object.assign(global, {
  window: dom.window,
  document: dom.window.document,
  navigator: dom.window.navigator,
  HTMLElement: dom.window.HTMLElement,
  Element: dom.window.Element,
  MouseEvent: dom.window.MouseEvent,
  KeyboardEvent: dom.window.KeyboardEvent,
});

// Mock WebSocket for P2P testing
global.WebSocket = class MockWebSocket {
  onopen?: () => void;
  onclose?: () => void;
  onmessage?: (event: any) => void;
  onerror?: () => void;
  readyState = 1;

  constructor() {}

  send() {}
  close() {}
} as any;

// Mock RTCPeerConnection
global.RTCPeerConnection = class MockRTCPeerConnection {
  onicecandidate?: () => void;
  ondatachannel?: () => void;
  onconnectionstatechange?: () => void;
  connectionState = "new";

  constructor() {}

  createOffer() {
    return Promise.resolve({});
  }
  createAnswer() {
    return Promise.resolve({});
  }
  setLocalDescription() {
    return Promise.resolve();
  }
  setRemoteDescription() {
    return Promise.resolve();
  }
  addIceCandidate() {
    return Promise.resolve();
  }
  createDataChannel() {
    return {
      onopen: null,
      onmessage: null,
      onclose: null,
      send: () => {},
      close: () => {},
      readyState: "open",
    };
  }
  close() {}
} as any;

// Mock performance API
global.performance = {
  now: () => Date.now(),
} as any;

// Mock requestAnimationFrame
global.requestAnimationFrame = (callback: FrameRequestCallback) => {
  return setTimeout(callback, 16) as any;
};

global.cancelAnimationFrame = (id: number) => {
  clearTimeout(id);
};
