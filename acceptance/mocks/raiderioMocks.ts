import { RaiderioProfile, Season } from '@/features/views/api/raiderio';

export const mockCharacter: RaiderioProfile = {
  id: 1,
  name: 'Arthas',
  realm: 'Tarren Mill',
  region: 'eu',
  score: 3000,
  class: 'Death Knight',
  spec: 'Frost',
  quantile: 1,
  mythicPlusBestRuns: [],
  mythicPlusRecentRuns: [],
  mythicPlusRanks: {
    overall: { world: 1, region: 1, realm: 1 },
    class: { world: 1, region: 1, realm: 1 },
    specs: [],
  },
};

export const mockSeason: Season = {
  is_main_season: true,
  slug: 'midnight-season-1',
  name: 'Midnight Season 1',
  blizzard_season_id: 1,
  dungeons: [{ name: 'Siege of Boralus', short_name: 'SIEGE', challenge_mode_id: 1 }],
};
