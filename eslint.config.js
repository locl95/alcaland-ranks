import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  tseslint.configs.recommended,
  {
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
    },
  },
  {
    files: ['src/features/**', 'src/shared/**'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{
          regex: '(^|/)games(/|$)',
          message: 'Shared code must not depend on a game. Move it into src/games/<game>/ or make it generic.',
        }],
      }],
    },
  },
  ...['wow', 'lol'].map((game) => ({
    files: [`src/games/${game}/**`],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{
          regex: `(^|/)games/(?!${game}(/|$))`,
          message: 'A game must not import another game. Move what they share into src/features/ or src/shared/.',
        }],
      }],
    },
  })),
  { ignores: ['dist', 'src/ImportMetaEnv.ts'] },
);
