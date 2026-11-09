import { describe, it, expect } from 'vitest';
import { compactTimeSince } from './last-login.ts';

const NOW = new Date('2026-11-08T20:00:00Z');
const ago = (ms: number) => compactTimeSince(new Date(NOW.getTime() - ms), NOW);

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe('compactTimeSince', () => {
  it.each([
    [30 * 1000, 'now'],
    [45 * MINUTE, '45m'],
    [5 * HOUR, '5h'],
    [3 * DAY, '3d'],
    [6 * DAY, '6d'],
    [15 * DAY, '2w'],
    [120 * DAY, '4mo'],
    [400 * DAY, '1y'],
  ])('%i ms ago is %s', (elapsed, expected) => {
    expect(ago(elapsed)).toBe(expected);
  });
});
