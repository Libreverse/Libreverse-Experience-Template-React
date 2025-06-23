// Test utilities and helper functions
import { describe, it, expect } from "bun:test";

export const createMockPlayerState = (overrides = {}) => ({
  id: "test-player",
  position: [0, 1, 0] as [number, number, number],
  rotation: [0, 0, 0] as [number, number, number],
  color: "#ff0000",
  name: "Test Player",
  ...overrides,
});

export const createMockGameObject = (overrides = {}) => ({
  id: "test-object",
  type: "box" as const,
  position: [0, 0, 0] as [number, number, number],
  rotation: [0, 0, 0] as [number, number, number],
  ...overrides,
});

export const createMockP2pMessage = (overrides = {}) => ({
  type: "Data" as const,
  senderId: "test-sender",
  data: { test: "data" },
  ...overrides,
});

// Test the utility functions themselves
describe("Test Utilities", () => {
  describe("createMockPlayerState", () => {
    it("should create valid player state with defaults", () => {
      const player = createMockPlayerState();

      expect(player.id).toBe("test-player");
      expect(player.position).toEqual([0, 1, 0]);
      expect(player.rotation).toEqual([0, 0, 0]);
      expect(player.color).toBe("#ff0000");
      expect(player.name).toBe("Test Player");
    });

    it("should accept overrides", () => {
      const player = createMockPlayerState({
        id: "custom-player",
        color: "#00ff00",
        position: [1, 2, 3],
      });

      expect(player.id).toBe("custom-player");
      expect(player.color).toBe("#00ff00");
      expect(player.position).toEqual([1, 2, 3]);
      expect(player.name).toBe("Test Player"); // unchanged
    });
  });

  describe("createMockGameObject", () => {
    it("should create valid game object with defaults", () => {
      const object = createMockGameObject();

      expect(object.id).toBe("test-object");
      expect(object.type).toBe("box");
      expect(object.position).toEqual([0, 0, 0]);
      expect(object.rotation).toEqual([0, 0, 0]);
    });

    it("should accept overrides", () => {
      const object = createMockGameObject({
        id: "custom-object",
        type: "sphere",
        scale: 2,
        color: "#0000ff",
      });

      expect(object.id).toBe("custom-object");
      expect(object.type).toBe("sphere");
      expect((object as any).scale).toBe(2);
      expect((object as any).color).toBe("#0000ff");
    });
  });

  describe("createMockP2pMessage", () => {
    it("should create valid P2P message with defaults", () => {
      const message = createMockP2pMessage();

      expect(message.type).toBe("Data");
      expect(message.senderId).toBe("test-sender");
      expect(message.data).toEqual({ test: "data" });
    });

    it("should accept overrides", () => {
      const message = createMockP2pMessage({
        type: "Connection",
        senderId: "custom-sender",
        data: { custom: "payload" },
      });

      expect(message.type).toBe("Connection");
      expect(message.senderId).toBe("custom-sender");
      expect(message.data).toEqual({ custom: "payload" });
    });
  });

  describe("Type Safety", () => {
    it("should maintain type safety with overrides", () => {
      // These should compile without errors
      const player = createMockPlayerState({
        position: [1, 2, 3] as [number, number, number],
      });

      const object = createMockGameObject({
        type: "sphere" as const,
      });

      const message = createMockP2pMessage({
        type: "Heartbeat" as const,
      });

      expect(player.position).toHaveLength(3);
      expect(object.type).toBe("sphere");
      expect(message.type).toBe("Heartbeat");
    });
  });
});
