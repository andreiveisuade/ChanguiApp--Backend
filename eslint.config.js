const js = require('@eslint/js');
const tseslint = require('typescript-eslint');
const prettier = require('eslint-config-prettier');

module.exports = tseslint.config(
  { ignores: ['dist/', 'coverage/', 'node_modules/'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // Deuda de la migración JS→TS: visible como warning, no bloquea.
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  // Archivos de configuración en CommonJS (eslint.config.js, jest.config.js).
  {
    files: ['**/*.js'],
    languageOptions: { sourceType: 'commonjs' },
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
  // Los tests usan require() para el hoisting de mocks de jest.
  {
    files: ['**/*.test.ts', '__tests__/**/*.ts'],
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
);
