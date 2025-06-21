// Babel configuration for Jest testing environment only
// Vite handles TypeScript/JSX compilation for the main application
export default {
  presets: [
    ["@babel/preset-env", { targets: { node: "current" } }],
    ["@babel/preset-react", { runtime: "automatic" }],
    ["@babel/preset-typescript"],
  ],
};
