import { WowProfile, Season } from '@/features/views/api/wow-types';

export const mockCharacter: WowProfile = {
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
  isCurrentSeason: true,
  slug: 'midnight-season-1',
  name: 'Midnight Season 1',
  blizzardSeasonId: 1,
  dungeons: [
    {
      name: 'Siege of Boralus',
      shortName: 'SIEGE',
      dungeonId: 1,
      icon: 'https://cdn.raiderio.net/images/dungeons/siege-of-boralus.jpg',
    },
  ],
};
