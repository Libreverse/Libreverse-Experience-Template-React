import { Canvas } from "@react-three/fiber";
import { Controllers, VRButton, XR } from "@react-three/xr";
import { type FC, Suspense, memo } from "react";
import Scene from "./Scene";
import { EffectsPipeline } from "./EffectsPipeline";
import { HotKeysProvider } from "./HotKeysProvider";

const Overlay: FC = memo(() => {
  return (
    <div className="ui-overlay">
      <h1>Libreverse Experience</h1>
      <p>Click objects to interact • Use mouse/touch to look around</p>
    </div>
  );
});

Overlay.displayName = "Overlay";

const App: FC = () => {
  return (
    <HotKeysProvider>
      <VRButton />
      <Canvas
        shadows
        camera={{ position: [0, 2, 5], fov: 75 }}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
        }}
      >
        <XR>
          <Controllers />
          <Suspense fallback={null}>
            <Scene />
          </Suspense>
        </XR>
        <EffectsPipeline />
      </Canvas>
      <Overlay />
    </HotKeysProvider>
  );
};

export default App;
