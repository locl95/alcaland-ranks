import { describe, it, expect } from 'vitest';
import { nextSort } from './column-sort.ts';

describe('nextSort', () => {
  it('sorts a new column highest first', () => {
    expect(nextSort({ key: 'level', direction: 'asc' }, 'ilvl')).toEqual({
      key: 'ilvl',
      direction: 'desc',
    });
  });

  it('flips the active column', () => {
    expect(nextSort({ key: 'ilvl', direction: 'desc' }, 'ilvl')).toEqual({
      key: 'ilvl',
      direction: 'asc',
    });
    expect(nextSort({ key: 'ilvl', direction: 'asc' }, 'ilvl')).toEqual({
      key: 'ilvl',
      direction: 'desc',
    });
  });
});
