import js from "@eslint/js";
import globals from "globals";

export default [
  {
    ignores: ["node_modules/**", "test-results/**", "playwright-report/**"],
  },
  js.configs.recommended,
  {
    files: ["appearance.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: globals.browser,
    },
  },
  {
    files: ["tests/**/*.js", "playwright.config.js", "vitest.config.js", "eslint.config.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { ...globals.browser, ...globals.node },
    },
  },
];
