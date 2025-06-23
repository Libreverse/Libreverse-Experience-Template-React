import { useMemo, Suspense } from "react";
import React from "react";
import { Effect } from "postprocessing";
import {
  EffectComposer,
  DepthOfField,
  Bloom,
  ToneMapping,
  SSAO,
  HueSaturation,
  BrightnessContrast,
  Vignette,
  Noise,
  ChromaticAberration,
} from "@react-three/postprocessing";

// Earth curvature fragment shader - simulates standing on a large sphere
const curvatureFragmentShader = `
  uniform float curveAmount;

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec2 coords = uv;
    
    // Calculate horizontal distance from center (represents distance from camera)
    float distanceFromCenter = abs(coords.x - 0.5) * 2.0;
    
    // Apply downward curve based on distance - simulates earth curvature
    // Objects further from camera (horizontally) appear lower due to earth's curve
    float curvature = curveAmount * distanceFromCenter * distanceFromCenter;
    coords.y += curvature;
    
    // Sample the texture with curved coordinates
    vec4 color;
    if (coords.x >= 0.0 && coords.x <= 1.0 && coords.y >= 0.0 && coords.y <= 1.0) {
      color = texture2D(inputBuffer, coords);
    } else {
      // For out-of-bounds, sample the nearest edge pixel
      vec2 clampedUV = clamp(coords, 0.001, 0.999);
      color = texture2D(inputBuffer, clampedUV);
    }
    
    outputColor = color;
  }
`;

// Curvature Effect class that properly extends postprocessing's Effect
class CurvatureEffect extends Effect {
  constructor(curveAmount = 0.04) {
    super("CurvatureEffect", curvatureFragmentShader, {
      uniforms: new Map([
        ["curveAmount", { value: curveAmount }],
      ]),
    });
  }

  update(_renderer: unknown, _inputBuffer: unknown, _deltaTime: number) {
    // Effect update logic if needed
  }
}

// React component wrapper for the CurvatureEffect
interface CurvaturePassProps {
  curveAmount?: number;
}

const CurvaturePass: React.FC<CurvaturePassProps> = ({ curveAmount }) => {
  const effect = useMemo(() => new CurvatureEffect(curveAmount), [curveAmount]);
  return <primitive object={effect} />;
};

export function EffectsPipeline({ curveAmount: _curveAmount = 0.04 }) {
  return (
    <Suspense fallback={null}>
      <EffectComposer enableNormalPass>
        {/* Early pipeline effects */}
        <SSAO samples={11} radius={12} intensity={0.5} luminanceInfluence={0.6} color="black" />
        <DepthOfField focusDistance={0.02} focalLength={0.025} bokehScale={2} height={480} />
        
        {/* Lighting and glow effects */}
        <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} intensity={0.7} />
        
        {/* Color grading and tone mapping */}
        <ToneMapping mode={1} />
        <HueSaturation hue={0} saturation={0.1} />
        <BrightnessContrast brightness={0.01} contrast={0.0} />
        
        {/* Distortion and stylization effects */}
        <CurvaturePass curveAmount={_curveAmount} />
        <ChromaticAberration offset={[0.001, 0.001]} />
        <Vignette eskil={false} offset={0.1} darkness={0.7} />
        
        {/* Noise effects (should be last) */}
        <Noise opacity={0.03} />
      </EffectComposer>
    </Suspense>
  );
}