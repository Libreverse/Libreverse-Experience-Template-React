import { createXRStore } from "@react-three/xr";
import { Canvas } from "@react-three/fiber";
import { VRButton, XR } from "@react-three/xr";
import { type FC, Suspense, useMemo } from "react";
import Scene from "./Scene";
import { EffectsPipeline } from "./EffectsPipeline";
import { HotKeysProvider } from "./HotKeysProvider";

const App: FC = () => {
  const store = useMemo(() => createXRStore(), []);

  return (
    <HotKeysProvider>
      <VRButton store={store} />
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          overflow: "hidden", // Crop the overscan
        }}
      >
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
    </HotKeysProvider>
  );
};

export default App;
