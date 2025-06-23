import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";
import typescript from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";
import prettierConfig from "eslint-config-prettier";
import type { Linter } from "eslint";

const compat = new FlatCompat();

export default [
  js.configs.recommended,
  ...compat.extends("standard-react"),
  {
    rules: {
      ...prettierConfig.rules,
    },
  },
  // TypeScript files in the src directory (with type-aware linting)
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        project: "./tsconfig.json",
      },
    },
    plugins: {
      "@typescript-eslint": typescript,
    },
    rules: {
      // Inherit standard-react rules first
      ...compat.extends("standard-react")[0].rules,
      // Then add TypeScript rules and disable conflicting base rules
      ...typescript.configs.recommended.rules,
      ...typescript.configs["eslint-recommended"].overrides[0].rules,
      // Then prettier overrides
      ...prettierConfig.rules,

      // TypeScript specific overrides
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/no-require-imports": "warn",

      // React specific overrides for TypeScript files
      "react/react-in-jsx-scope": "off", // Not needed with React 17+
      "react/prop-types": "off", // Using TypeScript for prop validation

      // Let TypeScript handle these
      "no-undef": "off",

      // Three.js compatibility
      "react/no-unknown-property": "off",
    },
  },
  // TypeScript files outside src directory (without type-aware linting)
  {
    files: ["**/*.{ts,tsx}"],
    ignores: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      "@typescript-eslint": typescript,
    },
    rules: {
      // Inherit standard-react rules first
      ...compat.extends("standard-react")[0].rules,
      // Then add basic TypeScript rules (no type-aware rules)
      ...typescript.configs["eslint-recommended"].overrides[0].rules,
      // Then prettier overrides
      ...prettierConfig.rules,

      // Basic TypeScript overrides
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",

      // React specific overrides for TypeScript files
      "react/react-in-jsx-scope": "off", // Not needed with React 17+
      "react/prop-types": "off", // Using TypeScript for prop validation

      // Let TypeScript handle these
      "no-undef": "off",

      // Three.js compatibility
      "react/no-unknown-property": "off",
    },
  },
  {
    files: [
      "**/*.test.{js,jsx,ts,tsx}",
      "**/__tests__/**/*.{js,jsx,ts,tsx}",
      "**/test-setup.*.{js,ts}",
    ],
    languageOptions: {
      globals: {
        jest: "readonly",
        describe: "readonly",
        it: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-require-imports": "off",
      "no-console": "off",
    },
  },
] as Linter.FlatConfig[];
