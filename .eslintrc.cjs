/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  env: {
    browser: true,
    es2020: true,
    node: true,
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ["@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/stylistic",
    "prettier",
  ],
  ignorePatterns: [
    "node_modules",
    ".next",
    "dist",
    "coverage",
    "pnpm-lock.yaml",
    "**/pnpm-lock.yaml",
  ],
  overrides: [
    {
      files: ["apps/web/**/*.{ts,tsx,js,jsx}"],
      extends: ["next/core-web-vitals", "prettier"],
    },
  ],
};

