export default {
  files: ["**/*.ts", "**/*.js"],
  ignores: ["dist", "build", "coverage"],
  languageOptions: {
    parser: "@typescript-eslint/parser",
    parserOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      project: "./tsconfig.json",
    },
    globals: {
      console: "readonly",
      process: "readonly",
      setTimeout: "readonly",
    },
  },
  rules: {
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-floating-promises": "error",
    "@typescript-eslint/no-misused-promises": "error",
    "@typescript-eslint/no-unnecessary-type-assertion": "error",
    "no-console": ["warn", { allow: ["warn", "error"] }],
    "no-debugger": "error",
  },
};
