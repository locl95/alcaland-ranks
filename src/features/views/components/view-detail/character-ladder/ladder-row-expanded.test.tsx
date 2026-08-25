import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LadderRowExpanded } from './ladder-row-expanded.tsx';
import { RaiderioProfile } from '@/features/views/api/raiderio.ts';

// The API sends 0 for every standing a character has not earned, so a profile
// with no score arrives full of zeroes rather than nulls.
const makeProfile = (score: number | null, quantile: number, rank: number): RaiderioProfile => ({
  id: 1,
  name: 'Arthas',
  realm: 'Tarren Mill',
  region: 'eu',
  score,
  quantile,
  class: 'Warrior',
  spec: 'Fury',
  mythicPlusBestRuns: [],
  mythicPlusRecentRuns: [],
  mythicPlusRanks: {
    overall: { world: rank, region: rank, realm: rank },
    class: { world: rank, region: rank, realm: rank },
    specs: [{ name: 'Fury', score: score ?? 0, world: rank, region: rank, realm: rank }],
  },
});

const renderExpanded = (character: RaiderioProfile) =>
  render(<LadderRowExpanded character={character} cachedCharacter={undefined} season={null} />);

describe('LadderRowExpanded', () => {
  it('reports the percentile and rankings for a scored character', () => {
    renderExpanded(makeProfile(2500, 3.42, 1234));

    expect(screen.getByText('3.42%')).toBeInTheDocument();
    expect(screen.getByText('Rankings')).toBeInTheDocument();
    expect(screen.getByText('Spec Rankings')).toBeInTheDocument();
    expect(screen.getAllByText('#1,234').length).toBeGreaterThan(0);
  });

  it('claims no standing for a character with no score', () => {
    renderExpanded(makeProfile(0, 0, 0));

    // Rendering the zeroes would read as the best results there are — "Top
    // 0.00%" and "#0" — rather than the absent ones they mean.
    expect(screen.queryByText(/of all players/)).not.toBeInTheDocument();
    expect(screen.queryByText('Rankings')).not.toBeInTheDocument();
    expect(screen.queryByText('Spec Rankings')).not.toBeInTheDocument();
    expect(screen.queryAllByText('#0')).toHaveLength(0);
  });

  it('claims no standing while a character is still syncing', () => {
    renderExpanded(makeProfile(null, 0, 0));

    expect(screen.queryByText(/of all players/)).not.toBeInTheDocument();
    expect(screen.queryByText('Rankings')).not.toBeInTheDocument();
    expect(screen.queryByText('Spec Rankings')).not.toBeInTheDocument();
    expect(screen.queryAllByText('#0')).toHaveLength(0);
  });
});
