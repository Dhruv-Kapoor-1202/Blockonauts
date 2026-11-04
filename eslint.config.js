import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/coverage/**',
      '**/node_modules/**',
      'reference/**',
      'Demo/**',
      'server/data/**',
      'docs/graphs/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    files: ['packages/engine/**/*.ts'],
    rules: {
      'no-restricted-globals': [
        'error',
        { name: 'window', message: 'The engine must stay free of DOM access.' },
        { name: 'document', message: 'The engine must stay free of DOM access.' },
        { name: 'localStorage', message: 'The engine must stay free of DOM access.' },
      ],
      'no-restricted-properties': [
        'error',
        { object: 'Math', property: 'random', message: 'Inject SeededRandom instead.' },
        { object: 'Date', property: 'now', message: 'Inject time instead.' },
      ],
    },
  },
  {
    files: ['client/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    languageOptions: { globals: globals.browser },
    rules: reactHooks.configs.recommended.rules,
  },
  {
    files: ['server/**/*.ts', 'scripts/**/*.ts', '*.config.{js,ts}', '**/*.config.{js,ts}'],
    languageOptions: { globals: globals.node },
  },
  prettier,
);
