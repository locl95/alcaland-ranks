import { describe, it, expect } from 'vitest';
import { League, LolPlayer } from '@/games/lol/api/lol-types.ts';
import { buildLadder } from './ladder.ts';

const league = (tier: string, leaguePoints: number): League => ({
  tier,
  rank: 'I',
  leaguePoints,
  gamesPlayed: 20,
  winrate: 0.5,
  teamPosition: 'TOP',
  matches: [],
});

const player = (name: string, solo?: League): LolPlayer => ({
  type: 'lol',
  summonerIcon: 1,
  summonerLevel: 100,
  summonerName: name,
  summonerTag: 'EUW',
  leagues: { SOLO_Q: solo },
});

const standingChanges = (players: LolPlayer[], cachedPlayers: LolPlayer[]) =>
  Object.fromEntries(
    buildLadder(players, cachedPlayers, 'solo').map((e) => [
      e.player.summonerName,
      e.standingChange,
    ]),
  );

describe('buildLadder standing change', () => {
  it('counts the places gained and lost since the last snapshot', () => {
    const changes = standingChanges(
      [player('Riser', league('GOLD', 90)), player('Faller', league('GOLD', 50))],
      [player('Riser', league('GOLD', 10)), player('Faller', league('GOLD', 60))],
    );

    expect(changes).toEqual({ Riser: 1, Faller: -1 });
  });

  it('is zero for a player who kept their place', () => {
    const changes = standingChanges(
      [player('Steady', league('GOLD', 90))],
      [player('Steady', league('GOLD', 10))],
    );

    expect(changes).toEqual({ Steady: 0 });
  });

  it('has no change for a player missing from the snapshot or unranked in either', () => {
    const changes = standingChanges(
      [
        player('Newcomer', league('GOLD', 90)),
        player('Placed', league('GOLD', 50)),
        player('Idle'),
      ],
      [player('Placed'), player('Idle')],
    );

    expect(changes).toEqual({ Newcomer: null, Placed: null, Idle: null });
  });
});
