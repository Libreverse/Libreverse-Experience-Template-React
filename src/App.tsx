import { createXRStore } from "@react-three/xr";
import { Canvas } from "@react-three/fiber";
import { VRButton, XR } from "@react-three/xr";
import { type FC, Suspense, memo } from "react";
import Scene from "./Scene";
import { EffectsPipeline } from "./EffectsPipeline";
import { HotKeysProvider } from "./HotKeysProvider";

const store = createXRStore();

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
      <VRButton store={store} />
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        overflow: "hidden", // Crop the overscan
      }}>
        <Canvas
          shadows
          camera={{ position: [0, 2, 5], fov: 75 }}
          style={{
            position: "absolute",
            top: "-10%", // Offset by half the overscan
            left: "-10%", // Offset by half the overscan
            width: "120vw", // 20% overscan
            height: "120vh", // 20% overscan
          }}
        >
          <XR store={store}>
            <Suspense fallback={null}>
              <Scene />
            </Suspense>
          </XR>
          <EffectsPipeline />
        </Canvas>
      </div>
      <Overlay />
    </HotKeysProvider>
  );
};

export default App;
