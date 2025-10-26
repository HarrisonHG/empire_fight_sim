import js from '@eslint/js';

export default [
  {
    ignores: ['node_modules/**'],
  },
  {
    ...js.configs.recommended,
    languageOptions: {
      ...js.configs.recommended.languageOptions,
      ecmaVersion: 2021,
      sourceType: 'module',
      globals: {
        ...js.configs.recommended.languageOptions?.globals,
        window: 'readonly',
        document: 'readonly',
      },
    },
  },
  {
    files: ['tests/**/*.js'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        vi: 'readonly',
      },
    },
  },
];
