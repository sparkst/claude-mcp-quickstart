import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        global: "readonly",
        require: "readonly",
      },
    },
    rules: {
      "no-unused-vars": "warn", // Warn but don't fail on unused variables
      "no-console": "off",
    },
  },
];
