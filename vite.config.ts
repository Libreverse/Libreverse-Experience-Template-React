import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import MillionLint from "@million/lint";
import cssnano from "cssnano";
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
        return html;
      }
    },
  };
};

export default defineConfig(({ mode }) => ({
  plugins: [
    react({
      babel: {
        plugins: [
          ...(mode === "production"
            ? [
                [
                  "babel-plugin-react-compiler",
                  {
                    compilationMode: "all",
                    panicThreshold: "none",
                    sources: (filename: string) =>
                      filename.endsWith(".tsx") ||
                      filename.endsWith(".jsx") ||
                      filename.endsWith(".ts") ||
                      filename.endsWith(".js"),
                    enableTreatRefLikeIdentifierAsRef: true,
                    enablePreserveExistingMemoizationGuarantees: false,
                    enableTransitivelyFreezeFunctionExpressions: true,
                  },
                ],
              ]
            : []),
        ],
      },
      jsxRuntime: "automatic", // Use automatic runtime in all modes
      jsxImportSource: "react", // Specify the import source consistently
    }),
    MillionLint.vite(),
    viteSingleFile({
      useRecommendedBuildConfig: true,
      removeViteModuleLoader: true,
      deleteInlinedFiles: true,
    }),
    htmlNanoPlugin(),
  ],
  build: {
    target: ["es2020", "edge88", "firefox78", "chrome87", "safari14"],
    modulePreload: { polyfill: true },
    cssCodeSplit: false,
    assetsInlineLimit: 2147483647,
    cssTarget: ["esnext"],
    cssMinify: "lightningcss",
    sourcemap: false,
    chunkSizeWarningLimit: 2147483647,
    reportCompressedSize: false,
    rollupOptions: {
      external: [],
      output: {
        minifyInternalExports: true,
        inlineDynamicImports: true,
        compact: true,
        generatedCode: {
          preset: "es2015",
          arrowFunctions: true,
          constBindings: true,
          objectShorthand: true,
        },
      },
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false,
        unknownGlobalSideEffects: false,
      },
    },
    minify: "terser",
    terserOptions: {
      parse: {
        bare_returns: false,
        html5_comments: false,
        shebang: false,
        ecma: 2020,
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
        ecma: 2020,
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
        passes: 10,
        properties: true,
        pure_getters: "strict",
        pure_funcs: [
          'console.log',
          'console.info',
          'console.debug',
          'console.warn',
          'console.error',
          'console.trace',
          'console.dir',
          'console.dirxml',
          'console.group',
          'console.groupCollapsed',
          'console.groupEnd',
          'console.time',
          'console.timeEnd',
          'console.timeLog',
          'console.assert',
          'console.count',
          'console.countReset',
          'console.profile',
          'console.profileEnd',
          'console.table',
          'console.clear',
        ],
        reduce_vars: true,
        reduce_funcs: true,
        sequences: true,
        side_effects: true,
        switches: true,
        toplevel: true,
        top_retain: null,
        typeofs: true,
        unsafe: true,
        unsafe_arrows: false,
        unsafe_comps: false,
        unsafe_Function: true,
        unsafe_math: true,
        unsafe_symbols: true,
        unsafe_methods: true,
        unsafe_proto: true,
        unsafe_regexp: true,
        unsafe_undefined: true,
        unused: true,
      },
      mangle: {
        eval: false,
        keep_classnames: false,
        keep_fnames: false,
        reserved: [],
        toplevel: true,
        safari10: false,
      },
      format: {
        ascii_only: false,
        beautify: false,
        braces: false,
        comments: "some",
        ecma: 2020,
        indent_level: 0,
        inline_script: true,
        keep_numbers: false,
        keep_quoted_props: false,
        max_line_len: 0,
        quote_keys: false,
        preserve_annotations: false,
        safari10: false,
        semicolons: true,
        shebang: false,
        webkit: false,
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
    lightningcss: {
      targets: {
        chrome: 87 << 16,
        edge: 88 << 16,
        firefox: 78 << 16,
        safari: (14 << 16),
      },
    },
  },
  define: {
    global: "globalThis",
  },
  server: {
    hmr: { overlay: false },
    fs: { strict: false },
  },
  experimental: {
    parserCache: true,
    hmrPartialAccept: true,
  },
  esbuild: {
    target: mode === "development" ? "esnext" : "es2020",
    keepNames: mode === "development",
    treeShaking: mode === "development" ? false : true,
    legalComments: mode === "development" ? "none" : "inline",
  },
}));