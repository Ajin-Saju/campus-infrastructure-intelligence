module.exports = {
  root: true,
  ignorePatterns: ['node_modules/', 'dist/', '.next/', 'coverage/', '**/next-env.d.ts'],
  extends: ['eslint:recommended'],
  env: {
    node: true,
    es6: true,
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx'],
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint'],
      extends: ['plugin:@typescript-eslint/recommended'],
      rules: {
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/triple-slash-reference': 'off',
      },
    },
  ],
};
