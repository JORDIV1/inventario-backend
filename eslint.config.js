import js from "@eslint/js";
import importPlugin from "eslint-plugin-import";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    files: ["**/*.js", "**/*.mjs", "**/*.cjs"], // 👈 aplica a tus .js
    plugins: { import: importPlugin },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.node, ...globals.es2023 },
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "import/no-unresolved": "off",

      // 👇 Si quieres que marque error cuando uses top-level await:
      "no-restricted-syntax": [
        "error",
        {
          selector: "Program > AwaitExpression",
          message: "No uses top-level await (envuélvelo en una función async).",
        },
      ],
    },
  },
];
