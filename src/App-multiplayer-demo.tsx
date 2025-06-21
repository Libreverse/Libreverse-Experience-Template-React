import { Canvas } from "@react-three/fiber";
import { XR, XRButton } from "@react-three/xr";
import React from "react";
import Scene from "./Scene";
import "./index.scss";

function App() {
  return (
    <div className="app">
      {/* Header with connection info */}
      <header className="app-header">
        <h1>Libreverse Experience - Multiplayer Demo</h1>
        <p>
          Move around with WASD keys, click to lock mouse, and see other players
          in real-time!
        </p>
      </header>

      {/* Main 3D Canvas */}
      <Canvas
        className="canvas"
        camera={{
          position: [0, 1, 5],
          fov: 75,
        }}
        shadows
        gl={{ alpha: false }}
      >
        <XR>
          <Scene />
        </XR>
      </Canvas>

      {/* VR Button */}
      <XRButton mode="VR" />

      {/* Instructions */}
      <div className="instructions">
        <h3>Controls</h3>
        <ul>
          <li>
            <strong>WASD</strong> - Move around
          </li>
          <li>
            <strong>Mouse</strong> - Look around (click to lock)
          </li>
          <li>
            <strong>Click objects</strong> - Interact (synchronized with other
            players)
          </li>
          <li>
            <strong>VR Button</strong> - Enter VR mode (if supported)
          </li>
        </ul>

        <h3>Multiplayer Features</h3>
        <ul>
          <li>Real-time player synchronization</li>
          <li>Shared object interactions</li>
          <li>Session-based rooms</li>
          <li>Connection status indicator</li>
        </ul>
      </div>
    </div>
  );
}

export default App;
