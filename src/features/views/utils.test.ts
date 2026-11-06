import { describe, it, expect } from 'vitest';
import { ApiError } from '@/shared/api/ApiError.ts';
import { formatLimitError } from './utils.ts';

describe('formatLimitError', () => {
  it('explains the ladder limit', () => {
    expect(formatLimitError(new ApiError(400, 'x', 'TOO_MANY_VIEWS'), 'players')).toBe(
      "You've reached the maximum number of ladders.",
    );
  });

  it('names the entities in the per-ladder limit', () => {
    expect(formatLimitError(new ApiError(400, 'x', 'TOO_MANY_ENTITIES'), 'players')).toBe(
      'This ladder has more players than allowed.',
    );
  });

  it('is null for any other error', () => {
    expect(formatLimitError(new ApiError(400, 'x', 'BAD_REQUEST'), 'players')).toBeNull();
    expect(formatLimitError(new Error('network'), 'players')).toBeNull();
  });
});
