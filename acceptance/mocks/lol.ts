import { Page } from '@playwright/test';
import { makeSimpleView, mockOwnViews } from './views';
import { API, VALID_VIEW_ID } from '../constants';

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

/** A two-player ladder, its data and its last snapshot, and Data Dragon answering offline. */
export async function mockLolLadder(page: Page) {
    await mockOwnViews(
      page,
      [makeSimpleView(VALID_VIEW_ID, 'Flex Squad', 'testuser', 'LOL')],
      'lol',
    );
    await page.route('https://ddragon.leagueoflegends.com/**', (route) =>
      route.request().url().endsWith('versions.json')
        ? route.fulfill({ json: ['15.1.1'] })
        : route.request().url().endsWith('champion.json')
          ? route.fulfill({ json: { data: {} } })
          : route.abort(),
    );
    await page.route(`${API}/views/${VALID_VIEW_ID}/data`, (route) =>
      route.fulfill({
        json: {
          viewName: 'Flex Squad',
          data: [
            lolPlayer('Faker', rankedLeague('CHALLENGER', 'I', 1200), undefined),
            lolPlayer('Caps', rankedLeague('DIAMOND', 'II', 40), rankedLeague('GOLD', 'I', 10)),
          ],
        },
      }),
    );
    await page.route(`${API}/views/${VALID_VIEW_ID}/cached-data`, (route) =>
      route.fulfill({ json: { viewName: 'Flex Squad', data: [] } }),
    );
}
