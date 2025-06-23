import { extend } from "@react-three/fiber";
import * as THREE from "three";
extend(THREE);
import { Physics, useBox, usePlane, useSphere } from "@react-three/cannon";
import { Grid, Html, PointerLockControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { Interactive } from "@react-three/xr";
import { type FC, useEffect, useRef, useState } from "react";
import type { Mesh as ThreeMesh } from "three/src/objects/Mesh.js";
type Mesh = ThreeMesh;
import { Vector3 } from "three/src/math/Vector3.js";
import type { PointerLockControls as PointerLockControlsImpl } from "three-stdlib";
import type { GameObjectUpdate, PlayerState } from "./p2p/types";
import { useHotKeys } from "./HotKeysProvider";

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

const DEFAULT_MATERIAL = { friction: 0.6, restitution: 0.2 };

const Box: FC<BoxProps> = ({ color, position, scale = 1 }) => {
  const [ref] = useBox<THREE.Object3D>(() => ({
    mass: 2, // more realistic mass
    position,
    args: [scale, scale, scale],
    material: DEFAULT_MATERIAL,
    allowSleep: true,
    sleepSpeedLimit: 0.1,
    sleepTimeLimit: 1,
    linearDamping: 0.05,
    angularDamping: 0.1,
  }));
  const [hovered, setHovered] = useState(false);
  return (
    <Interactive
      onHover={() => setHovered(true)}
      onBlur={() => setHovered(false)}
    >
      <mesh ref={ref} castShadow receiveShadow>
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
  const [ref] = useSphere<THREE.Object3D>(() => ({
    mass: 1,
    position,
    args: [0.5],
    material: DEFAULT_MATERIAL,
    allowSleep: true,
    sleepSpeedLimit: 0.1,
    sleepTimeLimit: 1,
    linearDamping: 0.02,
    angularDamping: 0.05,
  }));
  const [hovered, setHovered] = useState(false);
  return (
    <Interactive
      onHover={() => setHovered(true)}
      onBlur={() => setHovered(false)}
    >
      <mesh ref={ref} castShadow receiveShadow>
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
  const [ref] = usePlane<THREE.Object3D>(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, 0, 0],
    type: "Static",
    material: { friction: 0.9, restitution: 0.1 },
    allowSleep: true,
  }));
  return (
    <mesh ref={ref} visible={false} /* keep floor invisible */>
      <planeGeometry args={[1e9, 1e9]} />
      {/* No material needed since invisible */}
    </mesh>
  );
};

interface PlayerProps {
  onPlayerUpdate?: (playerState: PlayerState) => void;
  playerId: string;
  playerName: string;
  playerColor: string;
}

const Player: FC<PlayerProps> = ({
  onPlayerUpdate,
  playerId,
  playerName,
  playerColor,
}) => {
  const { camera } = useThree();
  // Add grounded state
  const [grounded, setGrounded] = useState(false);
  const [, api] = useSphere<THREE.Object3D>(() => ({
    mass: 1,
    position: [0, 1, 5],
    args: [0.5],
    fixedRotation: false, // allow rotation for realism
    linearDamping: 0.2,
    angularDamping: 0.2,
    material: DEFAULT_MATERIAL,
    allowSleep: true,
    sleepSpeedLimit: 0.1,
    sleepTimeLimit: 1,
    // Use onCollideBegin and onCollideEnd to track grounded state
    onCollideBegin: () => {
      setGrounded(true);
    },
    onCollideEnd: () => {
      setGrounded(false);
    },
  }));

  const velocity = useRef<[number, number, number]>([0, 0, 0]);
  const position = useRef<[number, number, number]>([0, 1, 5]);
  const lastUpdateTime = useRef<number>(0);

  // Use hotkeys context
  const { keys } = useHotKeys();

  useEffect(() => {
    api.velocity.subscribe((v: [number, number, number]) => {
      velocity.current = v;
    });
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

  useFrame(() => {
    // Build movement direction based on camera orientation
    const forward = new Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new Vector3();
    right.crossVectors(forward, new Vector3(0, 1, 0)).normalize();

    const moveDir = new Vector3();
    if (keys.w) moveDir.add(forward);
    if (keys.s) moveDir.sub(forward);
    if (keys.d) moveDir.add(right);
    if (keys.a) moveDir.sub(right);

    if (moveDir.lengthSq() > 0) {
      moveDir.normalize().multiplyScalar(5);
    }

    // Jump logic using grounded state
    if (keys.space && grounded) {
      api.velocity.set(moveDir.x, 7, moveDir.z); // set upward velocity for jump
      setGrounded(false); // prevent double jump until next contact
    } else {
      api.velocity.set(moveDir.x, velocity.current[1], moveDir.z);
    }

    const [x, y, z] = position.current;
    camera.position.set(x, y, z);
  });

  // No DOM elements returned
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

  useEffect(() => {
    // Smarter pointer lock that only activates when clicking on the 3D scene
    const autoLock = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Don't lock if clicking on UI elements (buttons, overlays, etc.)
      if (target && (
        target.closest('.vr-button') ||
        target.closest('.ui-overlay') ||
        target.closest('button') ||
        target.closest('input') ||
        target.closest('select') ||
        target.closest('textarea') ||
        target.closest('[data-no-pointer-lock]') ||
        target.tagName === 'BUTTON' ||
        target.tagName === 'INPUT' ||
        target.tagName === 'SELECT' ||
        target.tagName === 'TEXTAREA'
      )) {
        return;
      }

      // Only lock if we're not already locked and clicking on the canvas area
      if (document.pointerLockElement === null && (
        target.tagName === 'CANVAS' || 
        target.closest('canvas') ||
        !target.closest('.ui-overlay, .vr-button, button, input, select, textarea')
      )) {
        controlsRef.current?.lock?.();
      }
    };

    // Add escape key handler to unlock pointer
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && document.pointerLockElement) {
        document.exitPointerLock();
      }
    };

    window.addEventListener("mousedown", autoLock);
    window.addEventListener("keydown", handleEscape);
    
    return () => {
      window.removeEventListener("mousedown", autoLock);
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <>
      {/* Connection status indicator */}
      <Html position={[0, 2, 0]} style={{ zIndex: 1000 }} center>
        <div
          style={{
            color: isConnected ? "green" : "red",
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
      </Html>
      <Physics
        gravity={[0, -9.81, 0]}
        allowSleep
        defaultContactMaterial={{ friction: 0.7, restitution: 0.15 }}
      >
        <PointerLockControls ref={controlsRef} />
        <Player
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
          sectionSize={3} // original scale, but...
          fadeDistance={1000} // ...large fade for infinite look
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
