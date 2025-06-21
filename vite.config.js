import MillionLint from "@million/lint";
import legacy from "@vitejs/plugin-legacy";
import react from "@vitejs/plugin-react";
import cssnano from "cssnano";
import postcssPresetEnv from "postcss-preset-env";
import { defineConfig } from "vite";
import { ViteMinifyPlugin } from "vite-plugin-minify";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig(() => {
  return {
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: ["./src/test-setup.ts"],
    },
    css: {
      preprocessorOptions: {
        scss: {
          api: "modern-compiler",
        },
      },
      postcss: {
        plugins: [
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
      ViteMinifyPlugin({}),
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
