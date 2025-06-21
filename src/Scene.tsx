import { Physics, useBox, usePlane, useSphere } from "@react-three/cannon";
import { Grid, PointerLockControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { Interactive } from "@react-three/xr";
import { type FC, useEffect, useRef, useState } from "react";
import { type Mesh, Vector3 } from "three";
import type { PointerLockControls as PointerLockControlsImpl } from "three-stdlib";
import type { GameObjectUpdate, PlayerState } from "./p2p/types";

// Extend window type for P2P
declare global {
  interface Window {
    P2P?: {
      send: (data: {
        type: string;
        player?: PlayerState;
        object?: GameObjectUpdate;
      }) => void;
      addMessageHandler: (
        handler: (data: {
          type: string;
          player?: PlayerState;
          object?: GameObjectUpdate;
        }) => void,
      ) => void;
      connected: boolean;
      peerId: string;
      isHost: boolean;
    };
  }
}

interface BoxProps {
  color: string;
  position: [number, number, number];
  scale?: number;
}

const Box: FC<BoxProps> = ({ color, position, scale = 1 }) => {
  const [ref] = useBox<Mesh>(() => ({
    mass: 1,
    position,
    args: [scale, scale, scale],
  }));
  const [hovered, setHovered] = useState(false);
  return (
    <Interactive
      onHover={() => setHovered(true)}
      onBlur={() => setHovered(false)}
    >
      <mesh ref={ref}>
        <boxGeometry args={[scale, scale, scale]} />
        <meshStandardMaterial
          color={hovered ? "#ff0000" : color}
          roughness={0.5}
        />
      </mesh>
    </Interactive>
  );
};

interface SphereProps {
  position: [number, number, number];
}

const Sphere: FC<SphereProps> = ({ position }) => {
  const [ref] = useSphere<Mesh>(() => ({ mass: 1, position, args: [0.5] }));
  const [hovered, setHovered] = useState(false);
  return (
    <Interactive
      onHover={() => setHovered(true)}
      onBlur={() => setHovered(false)}
    >
      <mesh ref={ref}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial
          color={hovered ? "#ff0000" : "#4080ff"}
          roughness={0.3}
        />
      </mesh>
    </Interactive>
  );
};

const Floor: FC = () => {
  const [ref] = usePlane<Mesh>(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, 0, 0],
  }));
  return (
    <mesh ref={ref} visible={false}>
      <planeGeometry args={[100, 100]} />
    </mesh>
  );
};

interface PlayerProps {
  controlsRef: React.MutableRefObject<PointerLockControlsImpl | null>;
  onPlayerUpdate?: (playerState: PlayerState) => void;
  playerId: string;
  playerName: string;
  playerColor: string;
}

const Player: FC<PlayerProps> = ({
  controlsRef,
  onPlayerUpdate,
  playerId,
  playerName,
  playerColor,
}) => {
  const { camera } = useThree();
  const [, api] = useSphere<Mesh>(() => ({
    mass: 1,
    position: [0, 1, 5],
    args: [0.5],
    fixedRotation: true,
    linearDamping: 0.9,
  }));

  const velocity = useRef<[number, number, number]>([0, 0, 0]);
  const position = useRef<[number, number, number]>([0, 1, 5]);
  const lastUpdateTime = useRef<number>(0);

  useEffect(() => {
    api.velocity.subscribe(
      (v: [number, number, number]) => (velocity.current = v),
    );
    api.position.subscribe((p: [number, number, number]) => {
      position.current = p;
      // Send player updates every 100ms to avoid flooding
      const now = Date.now();
      if (now - lastUpdateTime.current > 100) {
        lastUpdateTime.current = now;
        onPlayerUpdate?.({
          id: playerId,
          position: p,
          rotation: [camera.rotation.x, camera.rotation.y, camera.rotation.z],
          color: playerColor,
          name: playerName,
        });
      }
    });
  }, [api, onPlayerUpdate, playerId, playerName, playerColor, camera]);

  const keys = useRef({ w: false, a: false, s: false, d: false });
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "KeyW") keys.current.w = true;
      if (e.code === "KeyS") keys.current.s = true;
      if (e.code === "KeyA") keys.current.a = true;
      if (e.code === "KeyD") keys.current.d = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "KeyW") keys.current.w = false;
      if (e.code === "KeyS") keys.current.s = false;
      if (e.code === "KeyA") keys.current.a = false;
      if (e.code === "KeyD") keys.current.d = false;
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Re-lock pointer controls if click events release it (e.g., after interacting with objects)
  useEffect(() => {
    const handlePointerDown = () => {
      if (document.pointerLockElement === null) {
        controlsRef.current?.lock?.();
      }
    };
    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, [controlsRef]);

  useFrame(() => {
    // Build movement direction based on camera orientation
    const forward = new Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new Vector3();
    right.crossVectors(forward, new Vector3(0, 1, 0)).normalize();

    const moveDir = new Vector3();
    if (keys.current.w) moveDir.add(forward);
    if (keys.current.s) moveDir.sub(forward);
    if (keys.current.d) moveDir.add(right);
    if (keys.current.a) moveDir.sub(right);

    if (moveDir.lengthSq() > 0) {
      moveDir.normalize().multiplyScalar(5);
    }

    api.velocity.set(moveDir.x, velocity.current[1], moveDir.z);

    const [x, y, z] = position.current;
    camera.position.set(x, y, z);
  });

  return null;
};

// Remote Player component to display other players in the session
interface RemotePlayerProps {
  player: PlayerState;
}

const RemotePlayer: FC<RemotePlayerProps> = ({ player }) => {
  const meshRef = useRef<Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.set(...player.position);
      meshRef.current.rotation.set(...player.rotation);
    }
  });

  return (
    <group>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color={player.color} />
      </mesh>
      {/* Simple name tag - in a real app you'd use Text from @react-three/drei */}
      <mesh
        position={[
          player.position[0],
          player.position[1] + 0.5,
          player.position[2],
        ]}
      >
        <planeGeometry args={[0.8, 0.2]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.7} />
      </mesh>
    </group>
  );
};

// Multiplayer Object component for shared interactive objects
interface MultiplayerObjectProps {
  object: GameObjectUpdate;
  onInteract?: (interaction: GameObjectUpdate["interaction"]) => void;
}

const MultiplayerObject: FC<MultiplayerObjectProps> = ({
  object,
  onInteract,
}) => {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [grabbed, setGrabbed] = useState(false);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.set(...object.position);
      meshRef.current.rotation.set(...object.rotation);
    }
  });

  const handleGrab = () => {
    if (!grabbed) {
      setGrabbed(true);
      onInteract?.({ type: "grab", playerId: "local" });
    }
  };

  const handleRelease = () => {
    if (grabbed) {
      setGrabbed(false);
      onInteract?.({ type: "release", playerId: "local" });
    }
  };

  return (
    <Interactive
      onHover={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      onSelect={handleGrab}
      onSelectEnd={handleRelease}
    >
      <mesh ref={meshRef}>
        {object.type === "box" ? (
          <boxGeometry
            args={[object.scale || 1, object.scale || 1, object.scale || 1]}
          />
        ) : (
          <sphereGeometry args={[object.scale || 0.5, 32, 32]} />
        )}
        <meshStandardMaterial
          color={hovered || grabbed ? "#ff0000" : object.color || "#4080ff"}
          roughness={0.3}
        />
      </mesh>
    </Interactive>
  );
};

const Scene: FC = () => {
  const controlsRef = useRef<PointerLockControlsImpl | null>(null);

  // Generate unique player ID and session ID
  const [playerId] = useState(
    () =>
      window.P2P?.peerId ?? `player_${Math.random().toString(36).substr(2, 9)}`,
  );
  const [playerName] = useState(
    () => `Player_${Math.random().toString(36).substr(2, 4)}`,
  );
  const [playerColor] = useState(
    () => `#${Math.floor(Math.random() * 16777215).toString(16)}`,
  );

  // Multiplayer state
  const [isConnected, setIsConnected] = useState(() => !!window.P2P?.connected);
  const [remotePlayers, setRemotePlayers] = useState<Map<string, PlayerState>>(
    new Map(),
  );
  const [remoteObjects, setRemoteObjects] = useState<
    Map<string, GameObjectUpdate>
  >(new Map());

  // Register P2P message handler
  useEffect(() => {
    if (!window.P2P) return;
    setIsConnected(window.P2P.connected);
    const handler = (msg: {
      type: string;
      player?: PlayerState;
      object?: GameObjectUpdate;
    }) => {
      if (msg.type === "player_update" && msg.player) {
        setRemotePlayers((prev) => {
          const next = new Map(prev);
          if (msg.player) next.set(msg.player.id, msg.player);
          return next;
        });
      } else if (msg.type === "object_update" && msg.object) {
        setRemoteObjects((prev) => {
          const next = new Map(prev);
          if (msg.object) next.set(msg.object.id, msg.object);
          return next;
        });
      }
    };
    window.P2P.addMessageHandler(handler);
    // Poll connection status
    const interval = setInterval(() => {
      if (window.P2P) setIsConnected(window.P2P.connected);
    }, 1000);
    return () => {
      clearInterval(interval);
    };
  }, []);

  const handlePlayerUpdate = (playerState: PlayerState) => {
    window.P2P?.send({ type: "player_update", player: playerState });
  };

  const handleObjectInteraction = (
    objectId: string,
    interaction: GameObjectUpdate["interaction"],
  ) => {
    if (interaction) {
      const objectUpdate: GameObjectUpdate = {
        id: objectId,
        type: "box", // or determine based on object
        position: [0, 0, 0], // get from object
        rotation: [0, 0, 0], // get from object
        interaction,
      };
      window.P2P?.send({ type: "object_update", object: objectUpdate });
    }
  };

  return (
    <>
      {/* Connection status indicator */}
      <div
        style={{
          position: "fixed",
          top: 10,
          left: 10,
          color: isConnected ? "green" : "red",
          zIndex: 1000,
          background: "rgba(0,0,0,0.7)",
          padding: "5px 10px",
          borderRadius: "5px",
          fontSize: "12px",
        }}
      >
        {isConnected
          ? `Connected (${remotePlayers.size} players)`
          : "Disconnected"}
      </div>

      <Physics gravity={[0, -9.81, 0]}>
        <PointerLockControls ref={controlsRef} />
        <Player
          controlsRef={controlsRef}
          onPlayerUpdate={handlePlayerUpdate}
          playerId={playerId}
          playerName={playerName}
          playerColor={playerColor}
        />
        <Floor />

        {/* Render remote players */}
        {Array.from(remotePlayers.values()).map((player) => (
          <RemotePlayer key={player.id} player={player} />
        ))}

        {/* Render remote objects */}
        {Array.from(remoteObjects.values()).map((object) => (
          <MultiplayerObject
            key={object.id}
            object={object}
            onInteract={(interaction) =>
              handleObjectInteraction(object.id, interaction)
            }
          />
        ))}

        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
        <Grid
          infiniteGrid
          cellSize={1}
          sectionSize={3}
          fadeDistance={30}
          fadeStrength={1}
        />
        <Box color="#50c878" position={[-2, 1, 0]} scale={1} />
        <Box color="#ff69b4" position={[2, 1, 0]} scale={0.8} />
        <Sphere position={[0, 1.5, -2]} />
      </Physics>
    </>
  );
};

export default Scene;
