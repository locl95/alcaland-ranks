import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

const WOW_GAMES = ['retail', 'forever'];

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
  {
    files: ['src/games/lol/**'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{
          regex: '(^|/)games/(?!lol(/|$))',
          message: 'A game must not import another game. Move what they share into src/features/ or src/shared/.',
        }],
      }],
    },
  },
  // The Warcraft games live in src/games/wow/<game>/; what they share sits in src/games/wow/.
  ...WOW_GAMES.map((game) => ({
    files: [`src/games/wow/${game}/**`],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{
          regex: '(^|/)games/(?!wow/)',
          message: 'A game must not import another game. Move what they share into src/features/ or src/shared/.',
        }, {
          regex: `(^|/)games/wow/(${WOW_GAMES.filter((other) => other !== game).join('|')})(/|$)`,
          message: 'A Warcraft game must not import another one. Move what they share into src/games/wow/.',
        }],
      }],
    },
  })),
  {
    files: ['src/games/wow/**'],
    ignores: WOW_GAMES.map((game) => `src/games/wow/${game}/**`),
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{
          regex: `(^|/)games/(?!wow/)|(^|/)games/wow/(${WOW_GAMES.join('|')})(/|$)`,
          message: 'Code shared by the Warcraft games must not depend on one of them, nor on another game.',
        }],
      }],
    },
  },
  { ignores: ['dist', 'src/ImportMetaEnv.ts'] },
);
