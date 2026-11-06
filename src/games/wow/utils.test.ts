import { describe, it, expect } from 'vitest';
import { getScoreClass, getScoreTier, ScoreTier } from './utils.ts';

describe('getScoreTier', () => {
  const boundaries: Array<[number, ScoreTier]> = [
    [0, 'grey'],
    [1599.99, 'grey'],
    [1600, 'green'],
    [2799.99, 'green'],
    [2800, 'blue'],
    [3399.99, 'blue'],
    [3400, 'purple'],
    [3998.99, 'purple'],
    [3999, 'orange'],
    [4500, 'orange'],
  ];

  it.each(boundaries)('maps %d to %s', (score, tier) => {
    expect(getScoreTier(score)).toBe(tier);
  });

  it('walks the ramp once, with every band contiguous', () => {
    const order: ScoreTier[] = [];
    for (let score = 0; score <= 5000; score += 0.25) {
      const tier = getScoreTier(score);
      if (order[order.length - 1] !== tier) order.push(tier);
    }

    // A band that reappears would show up twice here, which is what a wrong
    // comparison in the chain produces.
    expect(order).toEqual(['grey', 'green', 'blue', 'purple', 'orange']);
  });
});

describe('getScoreClass', () => {
  it('names the CSS class after the tier', () => {
    expect(getScoreClass(0)).toBe('score-grey');
    expect(getScoreClass(4500)).toBe('score-orange');
  });
});
