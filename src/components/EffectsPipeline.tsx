import { Suspense, useMemo } from "react";
import React from "react";
import { BlendFunction, Effect } from "postprocessing";
import {
  EffectComposer,
  SSAO,
  Bloom,
  Noise,
  DepthOfField,
  ChromaticAberration,
  Vignette,
} from "@react-three/postprocessing";

/* ---------- placeholder passes -------------------------------------------------- */
/* TODO: swap these minimal stubs with the real implementations when available. */
class ACESToneMap extends Effect {
  constructor() {
    super(
      "ACESFilmicToneMapping",
      "void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) { outputColor = inputColor; }",
      { blendFunction: BlendFunction.NORMAL },
    );
  }
}
class ContactShadowPass extends Effect {
  constructor() {
    super(
      "ContactShadowPass",
      "void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) { outputColor = inputColor; }",
      { blendFunction: BlendFunction.NORMAL },
    );
  }
}
class SSRPass extends Effect {
  constructor() {
    super(
      "SSRPass",
      "void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) { outputColor = inputColor; }",
      { blendFunction: BlendFunction.NORMAL },
    );
  }
}
class MotionBlurPass extends Effect {
  constructor() {
    super(
      "MotionBlurPass",
      "void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) { outputColor = inputColor; }",
      { blendFunction: BlendFunction.NORMAL },
    );
  }
}
/* ------------------------------------------------------------------------------- */

/* ---------- curvature pass --------------------------------------------------------- */
// ...existing code...
const curvatureFragmentShader = `
  uniform float curveStrength;
  uniform float safeArea;

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outColor) {
    float x = uv.x - 0.5;
    float y = uv.y - 0.5;
    
    // Calculate curvature based on horizontal distance only
    float radius = 1.0 / max(curveStrength, 0.0001);
    float curve = radius - sqrt(radius * radius - x * x);
    
    // Edge fade to prevent artifacts
    float edgeFadeX = smoothstep(0.48, 0.5, abs(x));
    float edgeFadeY = smoothstep(0.48, 0.5, abs(y));
    float edgeFade = max(edgeFadeX, edgeFadeY);
    
    // Apply vertical displacement based on horizontal position
    float curvedY = mix(uv.y, uv.y + curve, 1.0 - edgeFade);
    
    // Clamp to prevent sampling outside texture
    float newY = clamp(curvedY, 0.0, 1.0);
    float newX = clamp(uv.x, 0.0, 1.0);
    
    outColor = texture2D(inputBuffer, vec2(newX, newY));
  }
`;

class CurvatureEffect extends Effect {
  constructor(curveStrength: number = EFFECTS_CONFIG.curvature.strength) {
    super("Curvature", curvatureFragmentShader, {
      uniforms: new Map([
        ["curveStrength", { value: curveStrength }],
        ["depthTexture", { value: null }], // Injected by postprocessing
      ]),
    });
  }

  // Required by postprocessing to inject depth texture
  setDepthTexture(texture: unknown, _size: unknown) {
    const uniform = this.uniforms.get("depthTexture") as { value: unknown };
    uniform.value = texture;
  }

  // Setters for dynamic adjustment
  set curveStrength(v: number) {
    const uniform = this.uniforms.get("curveStrength") as
      | { value: number }
      | undefined;
    if (uniform) uniform.value = v;
  }
}

interface CurvaturePassProps {
  curveStrength?: number;
}

const CurvaturePass: React.FC<CurvaturePassProps> = ({
  curveStrength = EFFECTS_CONFIG.curvature.strength,
}) => {
  const effect = useMemo(
    () => new CurvatureEffect(curveStrength),
    [curveStrength],
  );

  React.useEffect(() => {
    effect.curveStrength = curveStrength;
  }, [effect, curveStrength]);

  return <primitive object={effect} />;
};
/* ------------------------------------------------------------------------------- */

/* ---------- atmospheric perspective pass --------------------------------------- */
const atmosphericFragmentShader = `
  uniform float density;
  uniform float falloff;
  uniform vec3 fogColor;
  
  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    // Very subtle atmospheric fog
    vec2 center = vec2(0.5, 0.5);
    float distFromCenter = length(uv - center);
    
    // Create an extremely gradual fog with multiple smoothstep layers for ultra-soft edges
    float fogFactor = smoothstep(0.2, 1.0, distFromCenter * density);
    fogFactor = smoothstep(0.0, 1.0, fogFactor); // Double smoothstep for ultra-soft transition
    fogFactor = pow(fogFactor, falloff);
    
    // Make fog much darker to match the scene's dark atmosphere
    // Use a very dark tint that barely affects the original colors
    vec3 darkAtmosphere = fogColor * 0.08; // Extremely dark fog
    vec3 foggedColor = mix(inputColor.rgb, darkAtmosphere, fogFactor * 0.15); // Very subtle influence
    
    outputColor = vec4(foggedColor, inputColor.a);
  }
`;

class AtmosphericPerspectiveEffect extends Effect {
  constructor(
    density: number = EFFECTS_CONFIG.atmosphericPerspective.density,
    falloff: number = EFFECTS_CONFIG.atmosphericPerspective.falloff,
    fogColor: [number, number, number] = EFFECTS_CONFIG.atmosphericPerspective
      .fogColor,
  ) {
    super("AtmosphericPerspective", atmosphericFragmentShader, {
      uniforms: new Map([
        ["density", { value: density }],
        ["falloff", { value: falloff }],
        ["fogColor", { value: fogColor }],
      ]),
    });
  }

  // Setters for dynamic adjustment
  set density(v: number) {
    const uniform = this.uniforms.get("density") as
      | { value: number }
      | undefined;
    if (uniform) uniform.value = v;
  }

  set falloff(v: number) {
    const uniform = this.uniforms.get("falloff") as
      | { value: number }
      | undefined;
    if (uniform) uniform.value = v;
  }

  set fogColor(v: [number, number, number]) {
    const uniform = this.uniforms.get("fogColor") as
      | { value: [number, number, number] }
      | undefined;
    if (uniform) uniform.value = v;
  }
}

interface AtmosphericPerspectivePassProps {
  density?: number;
  falloff?: number;
  fogColor?: [number, number, number];
}

const AtmosphericPerspectivePass: React.FC<AtmosphericPerspectivePassProps> = ({
  density = EFFECTS_CONFIG.atmosphericPerspective.density,
  falloff = EFFECTS_CONFIG.atmosphericPerspective.falloff,
  fogColor = EFFECTS_CONFIG.atmosphericPerspective.fogColor,
}) => {
  const effect = useMemo(
    () => new AtmosphericPerspectiveEffect(density, falloff, fogColor),
    [density, falloff, fogColor],
  );

  React.useEffect(() => {
    effect.density = density;
    effect.falloff = falloff;
    effect.fogColor = fogColor;
  }, [effect, density, falloff, fogColor]);

  return <primitive object={effect} />;
};
/* ------------------------------------------------------------------------------- */

/* ---------- distance desaturation pass --------------------------------------- */
const desaturationFragmentShader = `
  uniform float intensity;
  uniform float falloff;
  uniform float centerPreservation;
  
  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec2 center = vec2(0.5, 0.5);
    float distFromCenter = length(uv - center);
    
    // Create true gradient from center to edges without any preservation
    float desaturationFactor = pow(distFromCenter, falloff) * intensity;
    desaturationFactor = clamp(desaturationFactor, 0.0, 1.0);
    
    // Calculate luminance for desaturation
    float luminance = dot(inputColor.rgb, vec3(0.299, 0.587, 0.114));
    
    // Mix original color with desaturated (grayscale) version
    vec3 desaturatedColor = mix(inputColor.rgb, vec3(luminance), desaturationFactor);
    
    outputColor = vec4(desaturatedColor, inputColor.a);
  }
`;

class DistanceDesaturationEffect extends Effect {
  constructor(
    intensity: number = EFFECTS_CONFIG.distanceDesaturation.intensity,
    falloff: number = EFFECTS_CONFIG.distanceDesaturation.falloff,
    centerPreservation: number = EFFECTS_CONFIG.distanceDesaturation
      .centerPreservation,
  ) {
    super("DistanceDesaturation", desaturationFragmentShader, {
      uniforms: new Map([
        ["intensity", { value: intensity }],
        ["falloff", { value: falloff }],
        ["centerPreservation", { value: centerPreservation }],
      ]),
    });
  }

  // Setters for dynamic adjustment
  set intensity(v: number) {
    const uniform = this.uniforms.get("intensity") as
      | { value: number }
      | undefined;
    if (uniform) uniform.value = v;
  }

  set falloff(v: number) {
    const uniform = this.uniforms.get("falloff") as
      | { value: number }
      | undefined;
    if (uniform) uniform.value = v;
  }

  set centerPreservation(v: number) {
    const uniform = this.uniforms.get("centerPreservation") as
      | { value: number }
      | undefined;
    if (uniform) uniform.value = v;
  }
}

interface DistanceDesaturationPassProps {
  intensity?: number;
  falloff?: number;
  centerPreservation?: number;
}

const DistanceDesaturationPass: React.FC<DistanceDesaturationPassProps> = ({
  intensity = EFFECTS_CONFIG.distanceDesaturation.intensity,
  falloff = EFFECTS_CONFIG.distanceDesaturation.falloff,
  centerPreservation = EFFECTS_CONFIG.distanceDesaturation.centerPreservation,
}) => {
  const effect = useMemo(
    () =>
      new DistanceDesaturationEffect(intensity, falloff, centerPreservation),
    [intensity, falloff, centerPreservation],
  );

  React.useEffect(() => {
    effect.intensity = intensity;
    effect.falloff = falloff;
    effect.centerPreservation = centerPreservation;
  }, [effect, intensity, falloff, centerPreservation]);

  return <primitive object={effect} />;
};
/* ------------------------------------------------------------------------------- */

/* ---------- centralized configuration -------------------------------------------- */
type Q = "low" | "medium" | "high" | "ultra";

// Centralized effects configuration - all tunable values in one place
const EFFECTS_CONFIG = {
  // Quality-based settings
  quality: {
    low: { ssao: { samples: 6, radius: 8, intensity: 0.4 }, bloom: 0.4 },
    medium: { ssao: { samples: 8, radius: 10, intensity: 0.5 }, bloom: 0.55 },
    high: { ssao: { samples: 11, radius: 12, intensity: 0.6 }, bloom: 0.7 },
    ultra: { ssao: { samples: 16, radius: 15, intensity: 0.8 }, bloom: 0.9 },
  },

  // SSAO settings
  ssao: {
    luminanceInfluence: 0.6,
    color: "black",
  },

  // Depth of Field settings
  depthOfField: {
    ultra: {
      focusDistance: 0.02,
      focalLength: 0.025,
      bokehScale: 2,
    },
    normal: {
      focusDistance: 1000,
      focalLength: 0.1,
      bokehScale: 0,
    },
    height: 480,
  },

  // Bloom settings
  bloom: {
    luminanceThreshold: 0.25,
    mipmapBlur: true,
  },

  // Stylized effects
  chromaticAberration: {
    offset: [0.001, 0.001] as [number, number],
  },

  vignette: {
    eskil: false,
    offset: 0.1,
    darkness: 0.7,
  },

  noise: {
    lowQuality: 0.02,
    normalQuality: 0.03,
  },

  // Curvature settings
  curvature: {
    strength: 0.4, // 0 = flat, 1 = full screen shift.
  },

  // Atmospheric perspective settings
  atmosphericPerspective: {
    density: 1.2, // Higher density but with much softer transitions
    falloff: 3.5, // Very high falloff for extremely smooth gradients
    fogColor: [0.15, 0.18, 0.25] as [number, number, number], // Very dark blue-gray to match scene
  },

  // Distance desaturation settings
  distanceDesaturation: {
    intensity: 0.99, // Reduced intensity for more subtle effect
    falloff: 21, // Smoother gradient
    centerPreservation: 0.0, // No center preservation - smooth gradient from center
  },
} as const;

interface Props {
  quality?: Q;
  enableStylizedEffects?: boolean;
  enableCurvature?: boolean;
  enableAtmosphericPerspective?: boolean;
  enableDistanceDesaturation?: boolean;
}

export function EffectsPipeline({
  quality = "ultra",
  enableStylizedEffects = false,
}: Props) {
  const q = EFFECTS_CONFIG.quality[quality];

  // Make bottom three depend on enableStylizedEffects
  const curvatureEnabled = enableStylizedEffects;
  const atmosphericEnabled = enableStylizedEffects
  const desaturationEnabled = enableStylizedEffects;

  // Memoized placeholder passes
  const aces = useMemo(() => new ACESToneMap(), []);
  const cShadow = useMemo(() => new ContactShadowPass(), []);
  const ssr = useMemo(() => new SSRPass(), []);
  const motionBlur = useMemo(() => new MotionBlurPass(), []);

  return (
    <Suspense fallback={null}>
      <EffectComposer enableNormalPass depthBuffer multisampling={0}>
        {/* --- physically-based passes --- */}
        <primitive object={cShadow} />
        <SSAO
          {...q.ssao}
          luminanceInfluence={EFFECTS_CONFIG.ssao.luminanceInfluence}
          color={EFFECTS_CONFIG.ssao.color}
        />
        <DepthOfField
          focusDistance={
            quality === "ultra"
              ? EFFECTS_CONFIG.depthOfField.ultra.focusDistance
              : EFFECTS_CONFIG.depthOfField.normal.focusDistance
          }
          focalLength={
            quality === "ultra"
              ? EFFECTS_CONFIG.depthOfField.ultra.focalLength
              : EFFECTS_CONFIG.depthOfField.normal.focalLength
          }
          bokehScale={
            quality === "ultra"
              ? EFFECTS_CONFIG.depthOfField.ultra.bokehScale
              : EFFECTS_CONFIG.depthOfField.normal.bokehScale
          }
          height={EFFECTS_CONFIG.depthOfField.height}
        />
        <primitive object={quality === "ultra" ? ssr : cShadow} />
        <primitive object={quality === "ultra" ? motionBlur : cShadow} />
        <Bloom
          mipmapBlur={EFFECTS_CONFIG.bloom.mipmapBlur}
          intensity={q.bloom}
          luminanceThreshold={EFFECTS_CONFIG.bloom.luminanceThreshold}
        />
        <primitive object={aces} />

        {/* --- atmospheric perspective --- */}
        <AtmosphericPerspectivePass
          density={
            atmosphericEnabled
              ? EFFECTS_CONFIG.atmosphericPerspective.density
              : 0.0
          }
          falloff={EFFECTS_CONFIG.atmosphericPerspective.falloff}
          fogColor={EFFECTS_CONFIG.atmosphericPerspective.fogColor}
        />

        {/* --- distance desaturation --- */}
        <DistanceDesaturationPass
          intensity={
            desaturationEnabled
              ? EFFECTS_CONFIG.distanceDesaturation.intensity
              : 0.0
          }
          falloff={EFFECTS_CONFIG.distanceDesaturation.falloff}
          centerPreservation={
            EFFECTS_CONFIG.distanceDesaturation.centerPreservation
          }
        />

        {/* --- stylized passes (order preserved) --- */}
        <ChromaticAberration
          offset={
            enableStylizedEffects
              ? EFFECTS_CONFIG.chromaticAberration.offset
              : [0, 0]
          }
        />
        <Vignette
          eskil={EFFECTS_CONFIG.vignette.eskil}
          offset={enableStylizedEffects ? EFFECTS_CONFIG.vignette.offset : 0}
          darkness={
            enableStylizedEffects ? EFFECTS_CONFIG.vignette.darkness : 0
          }
        />
        <Noise
          opacity={
            quality === "low"
              ? EFFECTS_CONFIG.noise.lowQuality
              : EFFECTS_CONFIG.noise.normalQuality
          }
        />

        {/* --- curvature LAST so other passes work in flat space --- */}
        <CurvaturePass
          curveStrength={
            curvatureEnabled ? EFFECTS_CONFIG.curvature.strength : 0.0
          }
        />
      </EffectComposer>
    </Suspense>
  );
}
