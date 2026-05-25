module.exports = {
  root: true,
  env: {
    es2022: true,
    node: true,
    jest: true,
  },
  extends: ['eslint-config-custom'],
  ignorePatterns: ['dist/', '.turbo/', 'node_modules/'],
  rules: {
    '@typescript-eslint/ban-types': 'error',
    '@typescript-eslint/no-namespace': ['error', { allowDeclarations: true }],
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-useless-catch': 'error',
  },
};
