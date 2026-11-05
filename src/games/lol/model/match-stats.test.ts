import { describe, it, expect } from 'vitest';
import { LolMatch } from '@/games/lol/api/lol-types.ts';
import { formatKda, kda, roleSplit, summarize, topChampions } from './match-stats.ts';

let nextId = 0;
const match = (overrides: Partial<LolMatch> = {}): LolMatch => ({
  id: `m${nextId++}`,
  championId: 64,
  championName: 'LeeSin',
  individualPosition: 'JUNGLE',
  kills: 5,
  deaths: 2,
  assists: 5,
  wardsPlaced: 10,
  visionWardsBoughtInGame: 2,
  totalTimeSpentDead: 60,
  gameDuration: 1800,
  gameFinishedCorrectly: true,
  win: true,
  ...overrides,
});

describe('summarize', () => {
  it('leaves remakes out of wins, losses and winrate', () => {
    const summary = summarize([
      match({ win: true }),
      match({ win: false }),
      match({ win: false, gameDuration: 200 }),
      match({ win: true, gameFinishedCorrectly: false }),
    ]);

    expect(summary).toEqual({ wins: 1, losses: 1, remakes: 2, winrate: 0.5 });
  });

  it('has no winrate when every game was a remake', () => {
    expect(summarize([match({ gameDuration: 120 })]).winrate).toBeNull();
  });
});

describe('kda', () => {
  it('is perfect without deaths', () => {
    expect(formatKda(kda(3, 0, 4))).toBe('Perfect');
    expect(formatKda(kda(3, 2, 4))).toBe('3.5 KDA');
  });
});

describe('topChampions', () => {
  it('ranks champions by games, then wins, with their combined KDA', () => {
    const top = topChampions([
      match({ championId: 1, championName: 'Annie', win: false }),
      match({ championId: 2, championName: 'Olaf', kills: 2, deaths: 1, assists: 0 }),
      match({ championId: 2, championName: 'Olaf', kills: 4, deaths: 3, assists: 2 }),
      match({ championId: 3, championName: 'Galio', win: true }),
    ]);

    expect(top.map((c) => c.championName)).toEqual(['Olaf', 'Galio', 'Annie']);
    expect(top[0]).toMatchObject({ games: 2, wins: 2, kda: 2 });
  });

  it('keeps the five most played', () => {
    const many = [1, 2, 3, 4, 5, 6].map((id) => match({ championId: id }));
    expect(topChampions(many)).toHaveLength(5);
  });
});

describe('roleSplit', () => {
  it('lists every role in lane order, including the ones not played', () => {
    const roles = roleSplit([match({ individualPosition: 'UTILITY' }), match()]);

    expect(roles.map((r) => [r.position, r.games])).toEqual([
      ['TOP', 0],
      ['JUNGLE', 1],
      ['MIDDLE', 0],
      ['BOTTOM', 0],
      ['UTILITY', 1],
    ]);
  });
});
