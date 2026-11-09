import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CharacterMenu } from './character-menu.tsx';
import { WowProfile } from '@/games/wow/retail/api/wow-types.ts';

vi.mock('@/games/wow/retail/utils.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/games/wow/retail/utils.ts')>();
  return { ...actual, openExternalProfile: vi.fn() };
});

vi.mock('@/games/wow/retail/assets/raiderio.png', () => ({ default: 'raiderio.png' }));
vi.mock('@/games/wow/retail/assets/summoned.webp', () => ({ default: 'summoned.webp' }));

import { openExternalProfile } from '@/games/wow/retail/utils.ts';

const makeProfile = (): WowProfile => ({
  id: 1,
  name: 'Arthas',
  realm: 'Tarren Mill',
  region: 'eu',
  score: 3000,
  class: 'Death Knight',
  spec: 'Frost',
  quantile: 1,
  race: 'Human',
  faction: 'alliance',
  equippedItemLevel: 330,
  mythicPlusBestRuns: [],
  mythicPlusRecentRuns: [],
  mythicPlusRanks: {
    overall: { world: 1, region: 1, realm: 1 },
    class: { world: 1, region: 1, realm: 1 },
    specs: [],
  },
});

describe('CharacterMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls openExternalProfile with raiderio when Raider.io is clicked', async () => {
    const character = makeProfile();
    render(<CharacterMenu character={character} />);
    await userEvent.click(screen.getByRole('button'));
    await userEvent.click(screen.getByText('Raider.io'));
    expect(openExternalProfile).toHaveBeenCalledWith(character, 'raiderio');
  });

  it('calls openExternalProfile with summoned when Summoned.io is clicked', async () => {
    const character = makeProfile();
    render(<CharacterMenu character={character} />);
    await userEvent.click(screen.getByRole('button'));
    await userEvent.click(screen.getByText('Summoned.io'));
    expect(openExternalProfile).toHaveBeenCalledWith(character, 'summoned');
  });
});
