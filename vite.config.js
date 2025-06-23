import MillionLint from "@million/lint";
import legacy from "@vitejs/plugin-legacy";
import react from "@vitejs/plugin-react";
import cssnano from "cssnano";
import postcssPresetEnv from "postcss-preset-env";
import tailwindcss from "tailwindcss";
import { defineConfig } from "vite";
import posthtml from "rollup-plugin-posthtml";
import htmlnano from "htmlnano";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig(() => {
  return {
    resolve: {
      alias: {
        // Force all three.js imports to use the same instance
        three: "three",
        // Ensure sub-modules also resolve to the main three package
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
      ],
      exclude: ["three/examples/jsm/*"],
    },
    build: {
      rollupOptions: {
        external: [],
        plugins: [
          posthtml([
            htmlnano({
              collapseWhitespace: "conservative",
              removeComments: "safe",
              removeEmptyAttributes: true,
              removeRedundantAttributes: true,
              collapseBooleanAttributes: true,
              removeAttributeQuotes: false,
              minifyJs: true,
              minifyCss: true,
            }),
          ]),
        ],
      },
    },
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: ["./src/test-setup.ts"],
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
    plugins: [
      react(),
      MillionLint.vite(),
      viteSingleFile(),
      legacy({
        renderLegacyChunks: true,
        modernPolyfills: true,
        terserOptions: {
          ecma: 5,
          warnings: true,
          mangle: {
            properties: false,
            safari10: true,
            toplevel: false,
          },
          compress: {
            defaults: true,
            arrows: false,
            booleans_as_integers: false,
            booleans: true,
            collapse_vars: true,
            comparisons: true,
            conditionals: true,
            dead_code: true,
            drop_console: false,
            directives: true,
            evaluate: true,
            hoist_funs: true,
            if_return: true,
            join_vars: true,
            keep_fargs: false,
            loops: true,
            negate_iife: true,
            passes: 3,
            properties: true,
            reduce_vars: true,
            sequences: true,
            side_effects: true,
            toplevel: false,
            typeofs: false,
            unused: true,
          },
          output: {
            comments: /(?:copyright|licence|©)/i,
            beautify: false,
            semicolons: true,
          },
          keep_classnames: false,
          keep_fnames: false,
          safari10: true,
          module: true,
        },
      }),
    ],
  };
});
