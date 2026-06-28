import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
  { ignores: ['dist', 'node_modules'] },
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // React (and other PascalCase imports) are flagged as "unused" under the
      // automatic JSX runtime; ignore them. Rest-sibling omissions are how we
      // strip transient fields before persisting, so don't flag those either.
      'no-unused-vars': [
        'warn',
        // PascalCase vars/args are components referenced in JSX (which core
        // no-unused-vars can't see without eslint-plugin-react). Rest-sibling
        // omissions are how we strip transient fields before persisting.
        { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^(_|[A-Z])', ignoreRestSiblings: true },
      ],
    },
  },
  {
    // Unit tests import their helpers from 'vitest' explicitly and exercise pure
    // utilities, so they get Node globals.
    files: ['src/**/*.test.{js,jsx}'],
    languageOptions: { globals: { ...globals.node } },
  },
];
