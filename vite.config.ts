import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import MillionLint from "@million/lint";
import legacySwc from "vite-plugin-legacy-swc";
import htmlnano from "htmlnano";
import cssnano from "cssnano";
import postcssPresetEnv from "postcss-preset-env";
import tailwindcss from "tailwindcss";
import { viteSingleFile } from "vite-plugin-singlefile";

// Custom plugin to apply htmlnano
const htmlNanoPlugin = () => {
  return {
    name: 'html-nano',
    enforce: 'post' as const,
    apply: 'build' as const,
    async transformIndexHtml(html: string) {
      try {
        // Use dynamic import to properly load ES modules
        const posthtml = await import('posthtml');
        const htmlnanoModule = await import('htmlnano');
        
        const result = await posthtml.default()
          .use(htmlnanoModule.default({
            ...htmlnanoModule.default.presets.ampSafe,
          }))
          .process(html);
        
        return result.html;
      } catch (error) {
        console.warn('htmlnano optimization failed:', error);
        return html; // Return original HTML if optimization fails
      }
    }
  };
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    MillionLint.vite(),
    legacySwc({
      // Enhanced SWC-based legacy compilation for better performance
      // Explicit targets to match your browser support requirements
      targets: [
        'Chrome >= 8',
        'Edge >= 12', 
        'Safari >= 5.1',
        'Firefox >= 4',
        'ie >= 11',
        'and_chr >= 131',
        'iOS >= 8',
        'and_ff >= 132'
      ],
      modernPolyfills: true,
      renderLegacyChunks: false, // Don't split chunks for single file output
    }),
    // Add custom htmlnano plugin
    htmlNanoPlugin(),
    // Add vite-plugin-singlefile for single HTML file output - must be LAST
    viteSingleFile({
      useRecommendedBuildConfig: false, // Let us handle the build config
      removeViteModuleLoader: true,
      deleteInlinedFiles: true,
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
        // Remove manual chunks for single file output
        inlineDynamicImports: true,
        manualChunks: undefined, // Disable manual chunks for single file
      },
    },
    minify: "terser",
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
      three: 'three',
      'three/': 'three/',
    },
    dedupe: ['three', '@types/three'],
  },
  optimizeDeps: {
    include: [
      'three',
      '@react-three/fiber',
      '@react-three/drei',
      '@react-three/cannon',
      '@react-three/xr',
      '@react-three/postprocessing',
      'cannon-es',
      'postprocessing',
      'react',
      'react-dom',
      'react-hotkeys',
      '@rails/actioncable',
    ],
    exclude: ['three/examples/jsm/*'],
  },
  css: {
    postcss: {
      plugins: [
        tailwindcss,
        postcssPresetEnv({ stage: 3 }),
        cssnano({
          preset: [
            'advanced',
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
    global: 'globalThis',
  },
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
});