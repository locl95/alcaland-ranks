import { describe, it, expect } from 'vitest';
import { parseRiotId } from './riot-id.ts';

describe('parseRiotId', () => {
  it('splits a Riot ID into name and tag, keeping spaces inside the name', () => {
    expect(parseRiotId('  GTP ZeroMVPs # KAKO ')).toEqual({ name: 'GTP ZeroMVPs', tag: 'KAKO' });
  });

  it.each(['Faker', 'Faker#', '#KR1', 'Fa#ker#KR1'])('rejects %j', (input) => {
    expect(parseRiotId(input)).toBeNull();
  });
});
