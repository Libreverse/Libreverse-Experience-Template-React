import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";
import MillionLint from "@million/lint";
import legacySwc from "vite-plugin-legacy-swc";
import posthtml from "rollup-plugin-posthtml";
import htmlnano from "htmlnano";
import cssnano from "cssnano";
import postcssPresetEnv from "postcss-preset-env";
import tailwindcss from "tailwindcss";
import serviceWorker from "astrojs-service-worker";

export default defineConfig({
    compressHTML: false,
    prefetch: { prefetchAll: true },
    experimental: { clientPrerender: true },
    integrations: [
        react({
            include: "**/*.{jsx,tsx}",
            babel: {
                plugins: [
                    [
                        'babel-plugin-react-compiler',
                        {
                            compilationMode: 'infer',
                            runtimeModule: 'react-compiler-runtime',
                            target: '19',
                        },
                    ],
                ],
            },
        }),
        tailwind(),
        serviceWorker({
            workbox: {
                globPatterns: ['**/*.{js,css,html,woff,woff2}'],
                maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
                cleanupOutdatedCaches: true,
                skipWaiting: true,
                clientsClaim: true,
                inlineWorkboxRuntime: true,
                swDest: 'dist/sw.js',
            },
        }),
    ],
    output: 'static',
    build: {
        inlineStylesheets: 'auto',
    },
    vite: {
        build: {
            rollupOptions: {
                external: [],
                plugins: [
                    posthtml([
                        htmlnano(
                            htmlnano.presets.ampSafe,
                        ),
                    ]),
                ],
                output: {
                    minifyInternalExports: true,
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
                        'three-stdlib': ['three-stdlib'],
                    },
                },
            },
            minify: "terser", // Let SWC handle minification
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
                    properties: {
                        builtins: false,
                        debug: false,
                        keep_quoted: "strict",
                        reserved: [],
                    },
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
        plugins: [
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
                renderLegacyChunks: true, // Generate both modern and legacy chunks
            }),
        ],
        define: {
            global: 'globalThis',
        },
        server: {
            headers: {
                'Cross-Origin-Embedder-Policy': 'require-corp',
                'Cross-Origin-Opener-Policy': 'same-origin',
            },
        },
    },
});
