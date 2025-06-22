import { useThree, useFrame } from "@react-three/fiber";
import { useRef, useMemo } from "react";
import { WebGLRenderTarget } from 'three/src/renderers/WebGLRenderTarget.js';
import { LinearFilter, UnsignedShortType } from 'three/src/constants.js';
import { OrthographicCamera } from 'three/src/cameras/OrthographicCamera.js';
import { ShaderMaterial } from 'three/src/materials/ShaderMaterial.js';
import { Vector2 } from 'three/src/math/Vector2.js';
import { Mesh } from 'three/src/objects/Mesh.js';
import { PlaneGeometry } from 'three/src/geometries/PlaneGeometry.js';
import { DepthTexture } from 'three/src/textures/DepthTexture.js';

// FXAA shader from three.js examples
const FXAA_FRAGMENT = `
  uniform sampler2D tDiffuse;
  uniform vec2 resolution;
  varying vec2 vUv;
  void main() {
    vec2 invRes = 1.0 / resolution;
    vec3 rgbNW = texture2D(tDiffuse, vUv + vec2(-1.0, -1.0) * invRes).xyz;
    vec3 rgbNE = texture2D(tDiffuse, vUv + vec2(1.0, -1.0) * invRes).xyz;
    vec3 rgbSW = texture2D(tDiffuse, vUv + vec2(-1.0, 1.0) * invRes).xyz;
    vec3 rgbSE = texture2D(tDiffuse, vUv + vec2(1.0, 1.0) * invRes).xyz;
    vec3 rgbM  = texture2D(tDiffuse, vUv).xyz;
    vec3 luma = vec3(0.299, 0.587, 0.114);
    float lumaNW = dot(rgbNW, luma);
    float lumaNE = dot(rgbNE, luma);
    float lumaSW = dot(rgbSW, luma);
    float lumaSE = dot(rgbSE, luma);
    float lumaM  = dot(rgbM,  luma);
    float lumaMin = min(lumaM, min(min(lumaNW, lumaNE), min(lumaSW, lumaSE)));
    float lumaMax = max(lumaM, max(max(lumaNW, lumaNE), max(lumaSW, lumaSE)));
    vec2 dir;
    dir.x = -((lumaNW + lumaNE) - (lumaSW + lumaSE));
    dir.y =  ((lumaNW + lumaSW) - (lumaNE + lumaSE));
    float dirReduce = max((lumaNW + lumaNE + lumaSW + lumaSE) * (0.25 * 0.5), 1.0/128.0);
    float rcpDirMin = 1.0 / (min(abs(dir.x), abs(dir.y)) + dirReduce);
    dir = clamp(dir * rcpDirMin, vec2(-8.0, -8.0), vec2(8.0, 8.0)) * invRes;
    vec3 rgbA = 0.5 * (
      texture2D(tDiffuse, vUv + dir * (1.0/3.0 - 0.5)).xyz +
      texture2D(tDiffuse, vUv + dir * (2.0/3.0 - 0.5)).xyz);
    vec3 rgbB = rgbA * 0.5 + 0.25 * (
      texture2D(tDiffuse, vUv + dir * -0.5).xyz +
      texture2D(tDiffuse, vUv + dir * 0.5).xyz);
    float lumaB = dot(rgbB, luma);
    if ((lumaB < lumaMin) || (lumaB > lumaMax))
      gl_FragColor = vec4(rgbA, 1.0);
    else
      gl_FragColor = vec4(rgbB, 1.0);
  }
`;

export function EffectsPipeline({ curveAmount }: { curveAmount?: number } = {}) {
  const { gl, scene, camera, size } = useThree();
  const overscan = 0.1;
  const _curveAmount = curveAmount ?? 0.2;

  // Only use WebGLRenderTarget for compatibility
  const renderTarget = useMemo<WebGLRenderTarget>(() => {
    const w = size.width * (1 + overscan * 2);
    const h = size.height * (1 + overscan * 2);
    const rt = new WebGLRenderTarget(w, h);
    rt.texture.minFilter = LinearFilter;
    rt.texture.magFilter = LinearFilter;
    return rt;
  }, [size.width, size.height]);

  const fxaaTarget = useMemo<WebGLRenderTarget>(() => {
    const w = size.width;
    const h = size.height;
    const rt = new WebGLRenderTarget(w, h);
    rt.texture.minFilter = LinearFilter;
    rt.texture.magFilter = LinearFilter;
    return rt;
  }, [size.width, size.height]);

  const orthoCamera = useMemo(() => {
    const aspect = size.width / size.height;
    return new OrthographicCamera(-aspect, aspect, 1, -1, 0, 10);
  }, [size.width, size.height]);

  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          tDiffuse: { value: null },
          tDepth: { value: null },
          cameraNear: { value: camera.near },
          cameraFar: { value: camera.far },
          curveAmount: { value: _curveAmount },
          overscan: { value: overscan },
          desaturateStrength: { value: 0.75 },
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform sampler2D tDiffuse;
          uniform sampler2D tDepth;
          uniform float cameraNear;
          uniform float cameraFar;
          uniform float curveAmount;
          uniform float overscan;
          uniform float desaturateStrength;
          varying vec2 vUv;
          
          vec3 toGrayscale(vec3 color) {
            float gray = dot(color, vec3(0.299, 0.587, 0.114));
            return vec3(gray);
          }
          float getLinearDepth(float depth) {
            float z = depth * 2.0 - 1.0;
            return (2.0 * cameraNear * cameraFar) / (cameraFar + cameraNear - z * (cameraFar - cameraNear));
          }
          void main() {
            float o = overscan / (1.0 + overscan * 2.0);
            vec2 uv = vec2(mix(o, 1.0 - o, vUv.x), mix(o, 1.0 - o, vUv.y));
            float x = uv.x - 0.5;
            float y = uv.y - 0.5;
            float radius = 1.0 / max(curveAmount, 0.0001);
            float curve = radius - sqrt(radius * radius - x * x);
            float edgeFadeX = smoothstep(0.48, 0.5, abs(x));
            float edgeFadeY = smoothstep(0.48, 0.5, abs(y));
            float edgeFade = max(edgeFadeX, edgeFadeY);
            float curvedY = mix(uv.y, uv.y + curve, 1.0 - edgeFade);
            float newY = clamp(curvedY, 0.0, 1.0);
            float newX = clamp(uv.x, 0.0, 1.0);
            vec4 color = texture2D(tDiffuse, vec2(newX, newY));
            float depth = texture2D(tDepth, vec2(newX, newY)).x;
            float linearDepth = getLinearDepth(depth);
            float minDist = cameraNear + 1.0;
            float maxDist = cameraFar * 0.7;
            float distNorm = clamp((linearDepth - minDist) / (maxDist - minDist), 0.0, 1.0);
            float desat = distNorm * desaturateStrength;
            vec3 gray = toGrayscale(color.rgb);
            vec3 finalColor = mix(color.rgb, gray, desat);
            gl_FragColor = vec4(finalColor, color.a);
          }
        `,
      }),
    [_curveAmount, camera.near, camera.far, overscan]
  );

  const fxaaMaterial = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          tDiffuse: { value: null },
          resolution: { value: new Vector2(size.width, size.height) },
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = vec4(position, 1.0);
          }
        `,
        fragmentShader: FXAA_FRAGMENT,
      }),
    [size.width, size.height],
  );

  const quad = useRef<Mesh | null>(null);

  // Only assign depthTexture if supported
  const depthTexture = useMemo(() => {
    return new DepthTexture(
      size.width * (1 + overscan * 2),
      size.height * (1 + overscan * 2),
      UnsignedShortType
    );
  }, [size.width, size.height]);

  // Assign depthTexture
  (renderTarget as WebGLRenderTarget).depthTexture = depthTexture;

  const fxaaQuad = useMemo(() => {
    const mesh = new Mesh(new PlaneGeometry(2, 2), fxaaMaterial);
    mesh.position.set(0, 0, 0);
    mesh.scale.set(2, 2, 2);
    return mesh;
  }, [fxaaMaterial]);

  useFrame(() => {
    if (quad.current) quad.current.visible = false;
    gl.setRenderTarget(renderTarget);
    gl.setPixelRatio(2);
    gl.render(scene, camera);

    if (quad.current) {
      quad.current.visible = true;
      material.uniforms.tDiffuse.value = renderTarget.texture;
      material.uniforms.tDepth.value = (renderTarget as WebGLRenderTarget).depthTexture ?? null;
      material.uniforms.cameraNear.value = camera.near;
      material.uniforms.cameraFar.value = camera.far;
      gl.setRenderTarget(fxaaTarget);
      gl.render(quad.current, orthoCamera);
      quad.current.visible = false;
    }
    fxaaMaterial.uniforms.tDiffuse.value = fxaaTarget.texture;
    fxaaMaterial.uniforms.resolution.value.set(size.width, size.height);
    gl.setRenderTarget(null);
    gl.setPixelRatio(window.devicePixelRatio);
    gl.render(fxaaQuad, orthoCamera);
  }, 1);

  return (
    <mesh ref={quad} position={[0, 0, 0]} scale={[2, 2, 2]} visible={false}>
      <planeGeometry args={[2, 2]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
