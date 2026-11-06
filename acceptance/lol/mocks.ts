export const lolPlayer = (name: string, solo: object | undefined, flex: object | undefined) => ({
  type: 'lol',
  summonerIcon: 1,
  summonerLevel: 300,
  summonerName: name,
  summonerTag: 'EUW',
  leagues: { SOLO_Q: solo, FLEX_Q: flex },
});

export const midMatch = {
  id: 'EUW1_1',
  championId: 7,
  championName: 'Leblanc',
  individualPosition: 'MIDDLE',
  kills: 9,
  deaths: 1,
  assists: 6,
  wardsPlaced: 12,
  visionWardsBoughtInGame: 2,
  totalTimeSpentDead: 40,
  gameDuration: 1700,
  gameFinishedCorrectly: true,
  win: true,
  matchUp: { championId: 103, championName: 'Ahri', kills: 2, deaths: 7, assists: 3 },
};

export const rankedLeague = (tier: string, rank: string, leaguePoints: number) => ({
  tier,
  rank,
  leaguePoints,
  gamesPlayed: 20,
  winrate: 0.55,
  teamPosition: 'MIDDLE',
  matches: [midMatch],
});
