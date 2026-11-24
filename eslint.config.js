import js from '@eslint/js';
import tsPlugin from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';

export default tsPlugin.config(
  {
    ignores: ['dist', 'node_modules', 'coverage', '.gemini'],
  },
  js.configs.recommended,
  ...tsPlugin.configs.recommended,
  {
    files: ['**/*.{ts,tsx,js,mjs}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      'no-console': 'error',
      eqeqeq: ['error', 'always'],
      'prefer-const': 'error',
      'no-nested-ternary': 'warn',
      complexity: ['warn', 12],
    },
  },
  // Allow console in logger abstraction and standalone maintenance scripts
  {
    files: ['src/lib/logger.ts', 'scripts/**/*.{js,mjs,ts}'],
    rules: {
      'no-console': 'off',
    },
  },
  // Code length guidelines (skip tests and catalog/sample data files)
  {
    files: ['src/**/*.{ts,tsx}', 'api/**/*.{ts,tsx}'],
    ignores: ['**/*.test.{ts,tsx}', '**/tests/**'],
    rules: {
      'max-lines-per-function': [
        'warn',
        { max: 80, skipBlankLines: true, skipComments: true, IIFEs: true },
      ],
    },
  },
  {
    files: ['src/**/*.{ts,tsx}', 'api/**/*.{ts,tsx}'],
    ignores: ['**/*.test.{ts,tsx}', '**/tests/**', 'src/domain/catalog/**', 'src/data/samples/**'],
    rules: {
      'max-lines': ['warn', { max: 300, skipBlankLines: true, skipComments: true }],
    },
  },
  // Boundary rule: domain must be pure TypeScript and never import from UI, data, state, ai, or external frameworks
  {
    files: ['src/domain/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/data/**', '**/ai/**', '**/ui/**', '**/state/**', 'react', 'react-dom'],
              message:
                'Domain layer must remain pure and cannot import from data, ai, ui, state, or React.',
            },
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        {
          name: 'window',
          message: 'Domain layer must remain environment-agnostic; do not access global window.',
        },
        {
          name: 'document',
          message: 'Domain layer must remain environment-agnostic; do not access global document.',
        },
        {
          name: 'localStorage',
          message:
            'Domain layer must remain environment-agnostic; do not access global localStorage.',
        },
        {
          name: 'navigator',
          message: 'Domain layer must remain environment-agnostic; do not access global navigator.',
        },
        {
          name: 'fetch',
          message: 'Domain layer must remain pure; no I/O or network fetch allowed in domain core.',
        },
      ],
    },
  },
  // Boundary rule: data and ai cannot import from ui
  {
    files: ['src/data/**/*.{ts,tsx}', 'src/ai/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/ui/**', 'react', 'react-dom'],
              message: 'Data and AI layers cannot import UI components or React.',
            },
          ],
        },
      ],
    },
  },
);
