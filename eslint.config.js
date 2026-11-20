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
      '@typescript-eslint/no-explicit-any': 'warn',
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
              group: ['../data/*', '@/data/*', '../ai/*', '@/ai/*', '../ui/*', '@/ui/*', '../state/*', '@/state/*', 'react', 'react-dom'],
              message: 'Domain layer must remain pure and cannot import from data, ai, ui, state, or React.',
            },
          ],
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
              group: ['../ui/*', '@/ui/*', 'react', 'react-dom'],
              message: 'Data and AI layers cannot import UI components or React.',
            },
          ],
        },
      ],
    },
  },
);
