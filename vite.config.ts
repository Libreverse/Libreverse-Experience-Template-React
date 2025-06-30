import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import MillionLint from "@million/lint";
import legacySwc from "vite-plugin-legacy-swc";
import cssnano from "cssnano";
import postcssPresetEnv from "postcss-preset-env";
import tailwindcss from "tailwindcss";
import { viteSingleFile } from "vite-plugin-singlefile";

// Custom plugin to apply htmlnano
const htmlNanoPlugin = () => {
  return {
    name: "html-nano",
    enforce: "post" as const,
    apply: "build" as const,
    async transformIndexHtml(html: string) {
      try {
        // Use dynamic import to properly load ES modules
        const posthtml = await import("posthtml");
        const htmlnanoModule = await import("htmlnano");

        const result = await posthtml
          .default()
          .use(
            htmlnanoModule.default({
              ...htmlnanoModule.default.presets.ampSafe,
            }),
          )
          .process(html);

        return result.html;
      } catch (error) {
        console.warn("htmlnano optimization failed:", error);
        return html; // Return original HTML if optimization fails
      }
    },
  };
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Remove experimental Rolldown features since we're using regular Vite
  plugins: [
    react({
      babel: {
        plugins: [
          ...(mode === "production"
            ? [
                [
                  "babel-plugin-react-compiler",
                  {
                    compilationMode: "all", // Compile ALL components, not just annotated ones
                    panicThreshold: "none", // Bail out on any errors for debugging
                    sources: (filename: string) => {
                      return (
                        filename.endsWith(".tsx") ||
                        filename.endsWith(".jsx") ||
                        filename.endsWith(".ts") ||
                        filename.endsWith(".js")
                      );
                    },
                    // Additional aggressive optimizations
                    enableTreatRefLikeIdentifierAsRef: true,
                    enablePreserveExistingMemoizationGuarantees: false,
                    enableTransitivelyFreezeFunctionExpressions: true,
                  },
                ],
              ]
            : []),
        ],
      },
    }),
    MillionLint.vite(),
    // Move legacy plugin to match working Astro config pattern - it needs to create chunks
    viteSingleFile({
      useRecommendedBuildConfig: false, // Let us handle the build config
      removeViteModuleLoader: true,
      deleteInlinedFiles: true,
    }),
    // Add custom htmlnano plugin
    htmlNanoPlugin(),
    // Legacy plugin moved here to match working Astro pattern
    legacySwc({
      // Enhanced SWC-based legacy compilation for better performance
      // Explicit targets to match your browser support requirements
      targets: [
        "Chrome >= 8",
        "Edge >= 12", 
        "Safari >= 5.1",
        "Firefox >= 4",
        "ie >= 11",
        "and_chr >= 131",
        "iOS >= 8",
        "and_ff >= 132",
      ],
      modernPolyfills: true,
      renderLegacyChunks: true, // Enable legacy chunks like in working Astro config
    }),
  ],
  build: {
    // Optimize for single file output
    cssCodeSplit: false,
    assetsInlineLimit: 2147483647,
    rollupOptions: {
      external: [],
      output: {
        minifyInternalExports: true,
        // Allow legacy chunks but inline dynamic imports for other modules
        inlineDynamicImports: false, // Changed from true to allow legacy chunks
        // Use manualChunks for regular Vite/Rollup
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-three': ['three'],
          'three-fiber': ['@react-three/fiber'],
          'three-drei': ['@react-three/drei'],
          'three-cannon': ['@react-three/cannon', 'cannon-es'],
          'three-xr': ['@react-three/xr'],
          'three-postprocessing': ['@react-three/postprocessing', 'postprocessing'],
          'utils-actioncable': ['@rails/actioncable'],
          'utils-hotkeys': ['react-hotkeys'],
        },
      },
    },
    // Use terser like the working Astro config
    minify: "terser",
    // minify: "terser",
    // Enhanced Terser configuration with performance optimizations
    terserOptions: {
      parse: {
        bare_returns: false,
        html5_comments: false,
        shebang: false,
      },
      compress: {
        defaults: true,
        arrows: true,
        arguments: true,
        booleans: true,
        booleans_as_integers: false,
        collapse_vars: true,
        comparisons: true,
        computed_props: true,
        conditionals: true,
        dead_code: true,
        directives: true,
        drop_console: true,
        drop_debugger: true,
        ecma: 2015,
        evaluate: true,
        expression: false,
        global_defs: {},
        hoist_funs: true,
        hoist_props: true,
        hoist_vars: true,
        if_return: true,
        inline: true,
        join_vars: true,
        keep_classnames: false,
        keep_fargs: true,
        keep_fnames: false,
        keep_infinity: false,
        loops: true,
        negate_iife: true,
        passes: 3,
        properties: true,
        pure_getters: "strict",
        reduce_vars: true,
        reduce_funcs: true,
        sequences: true,
        side_effects: true,
        switches: true,
        toplevel: false,
        top_retain: null,
        typeofs: true,
        unsafe: false,
        unsafe_arrows: false,
        unsafe_comps: false,
        unsafe_Function: false,
        unsafe_math: false,
        unsafe_symbols: false,
        unsafe_methods: false,
        unsafe_proto: false,
        unsafe_regexp: false,
        unsafe_undefined: false,
        unused: true,
      },
      mangle: {
        eval: false,
        keep_classnames: false,
        keep_fnames: false,
        reserved: [],
        toplevel: false,
        safari10: true,
      },
      format: {
        ascii_only: false,
        beautify: false,
        braces: false,
        comments: "some",
        ecma: 2015,
        indent_level: 4,
        inline_script: true,
        keep_numbers: false,
        keep_quoted_props: false,
        max_line_len: 0,
        quote_keys: false,
        preserve_annotations: false,
        safari10: true,
        semicolons: true,
        shebang: false,
        webkit: true,
        wrap_iife: false,
        wrap_func_args: false,
      },
    },
  },
  resolve: {
    alias: {
      three: "three",
      "three/": "three/",
    },
    dedupe: ["three", "@types/three"],
  },
  optimizeDeps: {
    include: [
      "three",
      "@react-three/fiber",
      "@react-three/drei",
      "@react-three/cannon",
      "@react-three/xr",
      "@react-three/postprocessing",
      "cannon-es",
      "postprocessing",
      "react",
      "react-dom",
      "react-hotkeys",
      "@rails/actioncable",
    ],
    exclude: ["three/examples/jsm/*"],
  },
  css: {
    postcss: {
      plugins: [
        tailwindcss,
        postcssPresetEnv({ stage: 3 }),
        cssnano({
          preset: [
            "advanced",
            {
              autoprefixer: false,
              discardComments: { removeAllButCopyright: true },
              normalizeString: true,
              normalizeUrl: true,
              normalizeCharset: true,
            },
          ],
        }),
      ],
    },
  },
  define: {
    global: "globalThis",
  },
}));
