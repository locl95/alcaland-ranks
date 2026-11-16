import { describe, it, expect } from 'vitest';
import { pageSizeOptions, resolvePageSize, rowsPerPage } from './page-size.ts';

describe('pageSizeOptions', () => {
  it.each([
    [10, []],
    [20, [10, 'all']],
    [50, [10, 25, 'all']],
    [80, [10, 25, 50, 'all']],
    [100, [10, 25, 50, 'all']],
    [101, [10, 25, 50]],
    [300, [10, 25, 50]],
  ])('a ladder of %i offers %j', (total, options) => {
    expect(pageSizeOptions(total)).toEqual(options);
  });
});

describe('resolvePageSize', () => {
  it('keeps a size the ladder offers', () => {
    expect(resolvePageSize(25, 80)).toBe(25);
    expect(resolvePageSize('all', 80)).toBe('all');
  });

  it('falls back to the largest size when the ladder is too long to show whole', () => {
    expect(resolvePageSize('all', 300)).toBe(50);
  });

  it('shows the whole ladder when the picked size already holds it', () => {
    expect(resolvePageSize(50, 30)).toBe('all');
    expect(resolvePageSize(25, 25)).toBe('all');
  });

  it('pages by the default size when the ladder fits one page', () => {
    expect(resolvePageSize('all', 8)).toBe(10);
  });
});

describe('rowsPerPage', () => {
  it('is the size itself, or the whole ladder for "all"', () => {
    expect(rowsPerPage(25, 80)).toBe(25);
    expect(rowsPerPage('all', 80)).toBe(80);
    expect(rowsPerPage('all', 0)).toBe(1);
  });
});
