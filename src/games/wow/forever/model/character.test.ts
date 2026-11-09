import { describe, it, expect } from 'vitest';
import { characterKey, formatCharacterName } from './character.ts';

describe('characterKey', () => {
  it('ignores case and surrounding spaces, as the backend does', () => {
    expect(characterKey({ name: ' Daxan', surname: 'WINDFURY ', region: 'EU' })).toBe(
      characterKey({ name: 'daxan', surname: 'windfury', region: 'eu' }),
    );
  });

  it('tells apart the same name in another region', () => {
    expect(characterKey({ name: 'Daxan', surname: 'Windfury', region: 'eu' })).not.toBe(
      characterKey({ name: 'Daxan', surname: 'Windfury', region: 'us' }),
    );
  });
});

describe('formatCharacterName', () => {
  it('joins name and surname', () => {
    expect(formatCharacterName({ name: 'Siempre ', surname: ' Tarde', region: 'eu' })).toBe(
      'Siempre Tarde',
    );
  });
});
