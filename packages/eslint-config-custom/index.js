module.exports = {
  extends: [
    "eslint:recommended"
  ],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module"
  },
  env: {
    node: true,
    es6: true,
    jest: true
  },
  overrides: [
    {
      files: ["**/*.ts", "**/*.tsx"],
      parser: "@typescript-eslint/parser",
      plugins: ["@typescript-eslint"],
      extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended"
      ],
      rules: {
        "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
        "@typescript-eslint/explicit-function-return-type": "off",
        "@typescript-eslint/explicit-module-boundary-types": "off",
        "@typescript-eslint/no-explicit-any": "warn",
        "prefer-const": "error",
        "no-var": "error"
      }
    }
  ],
  rules: {
    "prefer-const": "error",
    "no-var": "error",
    "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }]
  },
  ignorePatterns: [
    "dist/",
    "node_modules/",
    "*.config.js",
    "coverage/"
  ]
};
