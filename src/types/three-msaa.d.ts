// TypeScript declaration for missing THREE.WebGLMultisampleRenderTarget
// Remove this file if/when @types/three adds the class officially.
declare module "three" {
  export class WebGLMultisampleRenderTarget extends WebGLRenderTarget {
    samples: number;
    constructor(width: number, height: number, options?: any);
  }
}
