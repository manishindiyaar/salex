module.exports = {
  extends: ['eslint-config-custom'],
  parserOptions: {
    project: './tsconfig.json',
  },
  rules: {
    // TypeScript type definitions specific rules
    '@typescript-eslint/no-unused-vars': 'off', // Types can be exported without being used locally
  },
};