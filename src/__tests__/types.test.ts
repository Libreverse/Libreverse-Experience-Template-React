import {
  ConnectionState,
  type GameObjectUpdate,
  MessageType,
  type P2pConfig,
  type P2pMessage,
  type PlayerState,
} from "../p2p/types";

describe("P2P Types Comprehensive Tests", () => {
  describe("ConnectionState Enum", () => {
    it("should have all required connection states", () => {
      expect(ConnectionState.SessionJoin).toBe("SessionJoin");
      expect(ConnectionState.SessionReady).toBe("SessionReady");
      expect(ConnectionState.SdpOffer).toBe("SdpOffer");
      expect(ConnectionState.SdpAnswer).toBe("SdpAnswer");
      expect(ConnectionState.IceCandidate).toBe("IceCandidate");
      expect(ConnectionState.Error).toBe("Error");
      expect(ConnectionState.New).toBe("new");
      expect(ConnectionState.Negotiating).toBe("negotiating");
      expect(ConnectionState.Connecting).toBe("connecting");
      expect(ConnectionState.Connected).toBe("connected");
      expect(ConnectionState.DisConnected).toBe("disconnected");
      expect(ConnectionState.Closed).toBe("closed");
      expect(ConnectionState.Failed).toBe("failed");
    });

    it("should contain all expected values", () => {
      const expectedValues = [
        "SessionJoin",
        "SessionReady",
        "SdpOffer",
        "SdpAnswer",
        "IceCandidate",
        "Error",
        "new",
        "negotiating",
        "connecting",
        "connected",
        "disconnected",
        "closed",
        "failed",
      ];

      const actualValues = Object.values(ConnectionState);
      expectedValues.forEach((value) => {
        expect(actualValues).toContain(value);
      });
    });
  });

  describe("MessageType Enum", () => {
    it("should have all required message types", () => {
      expect(MessageType.Connection).toBe("Connection");
      expect(MessageType.Heartbeat).toBe("Heartbeat");
      expect(MessageType.Data).toBe("Data");
      expect(MessageType.DataConnectionState).toBe("Data.Connection.State");
    });

    it("should be used in type definitions", () => {
      const messageTypes = Object.values(MessageType);
      expect(messageTypes).toHaveLength(4);
      messageTypes.forEach((type) => {
        expect(typeof type).toBe("string");
      });
    });
  });

  describe("P2pMessage Interface", () => {
    it("should accept valid P2P message", () => {
      const message: P2pMessage = {
        type: MessageType.Data,
        senderId: "test-sender",
        data: { test: "data" },
      };

      expect(message.type).toBe(MessageType.Data);
      expect(message.senderId).toBe("test-sender");
      expect(message.data).toEqual({ test: "data" });
    });

    it("should allow any data type", () => {
      const messages: P2pMessage[] = [
        {
          type: MessageType.Connection,
          senderId: "sender1",
          data: "string data",
        },
        {
          type: MessageType.Heartbeat,
          senderId: "sender2",
          data: 123,
        },
        {
          type: MessageType.Data,
          senderId: "sender3",
          data: { complex: { nested: "object" } },
        },
        {
          type: MessageType.DataConnectionState,
          senderId: "sender4",
          data: null,
        },
      ];

      messages.forEach((message, index) => {
        expect(message.senderId).toBe(`sender${index + 1}`);
        expect(message).toHaveProperty("data");
      });
    });

    it("should support all message types", () => {
      Object.values(MessageType).forEach((type) => {
        const message: P2pMessage = {
          type,
          senderId: "test-sender",
          data: `data for ${type}`,
        };
        expect(message.type).toBe(type);
      });
    });
  });

  describe("PlayerState Interface", () => {
    it("should accept valid player state", () => {
      const player: PlayerState = {
        id: "player-123",
        position: [1.5, 2.0, 3.5],
        rotation: [0, Math.PI / 4, 0],
        color: "#ff0000",
        name: "Test Player",
      };

      expect(player.id).toBe("player-123");
      expect(player.position).toEqual([1.5, 2.0, 3.5]);
      expect(player.rotation).toEqual([0, Math.PI / 4, 0]);
      expect(player.color).toBe("#ff0000");
      expect(player.name).toBe("Test Player");
    });

    it("should enforce proper array types for position and rotation", () => {
      const player: PlayerState = {
        id: "test",
        position: [0, 0, 0] as [number, number, number],
        rotation: [0, 0, 0] as [number, number, number],
        color: "#000000",
        name: "Test",
      };

      expect(player.position).toHaveLength(3);
      expect(player.rotation).toHaveLength(3);
      expect(typeof player.position[0]).toBe("number");
      expect(typeof player.rotation[0]).toBe("number");
    });

    it("should support different player configurations", () => {
      const players = [
        {
          id: "player1",
          position: [0, 1, 0] as [number, number, number],
          rotation: [0, 0, 0] as [number, number, number],
          color: "#ff0000",
          name: "Player One",
        },
        {
          id: "player2",
          position: [-5, 2, 10] as [number, number, number],
          rotation: [0.1, 0.2, 0.3] as [number, number, number],
          color: "#00ff00",
          name: "Player Two",
        },
      ];

      players.forEach((player, index) => {
        expect(player.id).toBe(`player${index + 1}`);
        expect(Array.isArray(player.position)).toBe(true);
        expect(Array.isArray(player.rotation)).toBe(true);
        expect(player.color).toMatch(/^#[0-9a-f]{6}$/i);
      });
    });
  });

  describe("GameObjectUpdate Interface", () => {
    it("should accept valid game object update", () => {
      const object: GameObjectUpdate = {
        id: "object-123",
        type: "box",
        position: [1, 2, 3],
        rotation: [0, 0, 0],
        scale: 1.5,
        color: "#00ff00",
        interaction: {
          type: "grab",
          playerId: "player-456",
        },
      };

      expect(object.id).toBe("object-123");
      expect(object.type).toBe("box");
      expect(object.position).toEqual([1, 2, 3]);
      expect(object.rotation).toEqual([0, 0, 0]);
      expect(object.scale).toBe(1.5);
      expect(object.color).toBe("#00ff00");
      expect(object.interaction?.type).toBe("grab");
      expect(object.interaction?.playerId).toBe("player-456");
    });

    it("should accept both box and sphere types", () => {
      const box: GameObjectUpdate = {
        id: "box-1",
        type: "box",
        position: [0, 1, 0],
        rotation: [0, 0, 0],
      };

      const sphere: GameObjectUpdate = {
        id: "sphere-1",
        type: "sphere",
        position: [0, 1, 0],
        rotation: [0, 0, 0],
      };

      expect(box.type).toBe("box");
      expect(sphere.type).toBe("sphere");
    });

    it("should make optional properties optional", () => {
      const minimalObject: GameObjectUpdate = {
        id: "minimal",
        type: "box",
        position: [0, 0, 0],
        rotation: [0, 0, 0],
      };

      expect(minimalObject.scale).toBeUndefined();
      expect(minimalObject.color).toBeUndefined();
      expect(minimalObject.interaction).toBeUndefined();
    });

    it("should support all interaction types", () => {
      const interactions: Array<{
        type: "grab" | "release" | "hover";
        playerId: string;
      }> = [
        { type: "grab", playerId: "player1" },
        { type: "release", playerId: "player2" },
        { type: "hover", playerId: "player3" },
      ];

      interactions.forEach((interaction, index) => {
        expect(interaction.type).toBeDefined();
        expect(interaction.playerId).toBe(`player${index + 1}`);

        const object: GameObjectUpdate = {
          id: `object-${index}`,
          type: "box",
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          interaction,
        };

        expect(object.interaction).toEqual(interaction);
      });
    });
  });

  describe("P2pConfig Interface", () => {
    it("should accept valid P2P configuration", () => {
      const config: P2pConfig = {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          {
            urls: "turn:example.com:3478",
            username: "user",
            credential: "pass",
          },
        ],
        heartbeat: {
          interval_mls: 1000,
          idle_timeout_mls: 30000,
        },
      };

      expect(config.iceServers).toHaveLength(2);
      expect(config.iceServers[0].urls).toBe("stun:stun.l.google.com:19302");
      expect(config.iceServers[1].urls).toBe("turn:example.com:3478");
      expect(config.iceServers[1].username).toBe("user");
      expect(config.iceServers[1].credential).toBe("pass");
      expect(config.heartbeat.interval_mls).toBe(1000);
      expect(config.heartbeat.idle_timeout_mls).toBe(30000);
    });

    it("should accept empty ice servers array", () => {
      const config: P2pConfig = {
        iceServers: [],
        heartbeat: {
          interval_mls: 500,
          idle_timeout_mls: 15000,
        },
      };

      expect(config.iceServers).toHaveLength(0);
      expect(config.heartbeat.interval_mls).toBe(500);
    });

    it("should validate heartbeat configuration", () => {
      const heartbeatConfigs = [
        { interval_mls: 100, idle_timeout_mls: 5000 },
        { interval_mls: 1000, idle_timeout_mls: 30000 },
        { interval_mls: 5000, idle_timeout_mls: 60000 },
      ];

      heartbeatConfigs.forEach((heartbeat, _index) => {
        const config: P2pConfig = {
          iceServers: [],
          heartbeat,
        };

        expect(config.heartbeat.interval_mls).toBeGreaterThan(0);
        expect(config.heartbeat.idle_timeout_mls).toBeGreaterThan(
          config.heartbeat.interval_mls,
        );
      });
    });
  });

  describe("Type Compatibility and Integration", () => {
    it("should allow P2P message with player state data", () => {
      const playerState: PlayerState = {
        id: "player1",
        position: [0, 1, 0],
        rotation: [0, 0, 0],
        color: "#ffffff",
        name: "Player 1",
      };

      const message: P2pMessage = {
        type: MessageType.Data,
        senderId: "player1",
        data: playerState,
      };

      expect(message.data).toEqual(playerState);
      expect((message.data as PlayerState).id).toBe("player1");
    });

    it("should allow P2P message with game object data", () => {
      const objectUpdate: GameObjectUpdate = {
        id: "obj1",
        type: "box",
        position: [1, 2, 3],
        rotation: [0, 0, 0],
      };

      const message: P2pMessage = {
        type: MessageType.Data,
        senderId: "player1",
        data: objectUpdate,
      };

      expect(message.data).toEqual(objectUpdate);
      expect((message.data as GameObjectUpdate).type).toBe("box");
    });

    it("should support complex message scenarios", () => {
      // Batch updates
      const batchUpdate = {
        players: [
          {
            id: "p1",
            position: [1, 0, 0],
            rotation: [0, 0, 0],
            color: "#f00",
            name: "P1",
          },
          {
            id: "p2",
            position: [2, 0, 0],
            rotation: [0, 0, 0],
            color: "#0f0",
            name: "P2",
          },
        ] as PlayerState[],
        objects: [
          { id: "o1", type: "box", position: [0, 1, 0], rotation: [0, 0, 0] },
          {
            id: "o2",
            type: "sphere",
            position: [0, 2, 0],
            rotation: [0, 0, 0],
          },
        ] as GameObjectUpdate[],
      };

      const message: P2pMessage = {
        type: MessageType.Data,
        senderId: "server",
        data: batchUpdate,
      };

      expect((message.data as typeof batchUpdate).players).toHaveLength(2);
      expect((message.data as typeof batchUpdate).objects).toHaveLength(2);
    });
  });

  describe("Real-world Usage Patterns", () => {
    it("should support player movement updates", () => {
      const movementUpdate = (
        playerId: string,
        newPosition: [number, number, number],
      ) => {
        const message: P2pMessage = {
          type: MessageType.Data,
          senderId: playerId,
          data: {
            action: "move",
            position: newPosition,
            timestamp: Date.now(),
          },
        };
        return message;
      };

      const moveMessage = movementUpdate("player1", [5, 0, 5]);
      expect(moveMessage.senderId).toBe("player1");
      expect((moveMessage.data as any).action).toBe("move");
      expect((moveMessage.data as any).position).toEqual([5, 0, 5]);
    });

    it("should support object interaction workflows", () => {
      const interactionFlow = [
        { type: "hover", playerId: "p1" },
        { type: "grab", playerId: "p1" },
        { type: "release", playerId: "p1" },
      ] as const;

      interactionFlow.forEach((interaction, _index) => {
        const objectUpdate: GameObjectUpdate = {
          id: "interactive-box",
          type: "box",
          position: [0, 1, 0],
          rotation: [0, 0, 0],
          interaction: {
            type: interaction.type,
            playerId: interaction.playerId,
          },
        };

        expect(objectUpdate.interaction?.type).toBe(interaction.type);
        expect(objectUpdate.interaction?.playerId).toBe("p1");
      });
    });
  });
});
