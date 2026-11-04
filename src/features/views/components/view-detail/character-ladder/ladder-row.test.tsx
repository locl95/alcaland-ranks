import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { LadderRow } from './ladder-row.tsx';
import { WowProfile } from '@/features/views/api/wow-types.ts';

vi.mock('./character-menu.tsx', () => ({
  CharacterMenu: () => <div data-testid="character-menu" />,
}));

vi.mock('./ladder-row-expanded.tsx', () => ({
  LadderRowExpanded: () => <div data-testid="ladder-row-expanded" />,
}));

vi.mock('@/features/views/constants/class-images.ts', () => ({
  CLASS_IMAGES: {} as Record<string, string>,
  getClassImageKey: () => 'warrior',
}));

vi.mock('@/features/views/constants/race-images.ts', () => ({
  RACE_IMAGES: { nightelf: 'nightelf.png' } as Record<string, string>,
  getRaceImageKey: (race: string) => race.toLowerCase().replace(/\s+/g, ''),
}));

const makeProfile = (overrides: Partial<WowProfile> = {}): WowProfile => ({
  id: 1,
  name: 'Arthas',
  realm: 'Tarren Mill',
  region: 'eu',
  score: 3000,
  class: 'Warrior',
  spec: 'Arms',
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
  ...overrides,
});

describe('LadderRow', () => {
  it('shows Syncing… indicator when score is null and class is empty (new character)', () => {
    render(
      <LadderRow
        index={0}
        character={makeProfile({ score: null, class: '', spec: '' })}
        cachedCharacters={[]}
        season={null}
      />,
    );
    expect(screen.getByText('Syncing…')).toBeInTheDocument();
  });

  it('shows Deleting… indicator when score is null and class is set (existing character being deleted)', () => {
    render(
      <LadderRow
        index={0}
        character={makeProfile({ score: null, class: 'Warrior' })}
        cachedCharacters={[]}
        season={null}
      />,
    );
    expect(screen.getByText('Deleting…')).toBeInTheDocument();
  });

  it('does not show syncing indicator for normal characters', () => {
    render(<LadderRow index={0} character={makeProfile()} cachedCharacters={[]} season={null} />);
    expect(screen.queryByText('Syncing…')).not.toBeInTheDocument();
    expect(screen.queryByText('Deleting…')).not.toBeInTheDocument();
  });

  it('shows score for non-syncing characters', () => {
    render(
      <LadderRow
        index={0}
        character={makeProfile({ score: 3000 })}
        cachedCharacters={[]}
        season={null}
      />,
    );
    expect(screen.getByText('3,000')).toBeInTheDocument();
  });

  it('shows position improvement when ranked higher than cached', () => {
    const char = makeProfile({ id: 1 });
    const cachedAtRank2 = makeProfile({ id: 1, score: 2000 });
    render(
      <LadderRow
        index={0}
        character={char}
        cachedCharacters={[makeProfile({ id: 99 }), cachedAtRank2]}
        season={null}
      />,
    );
    expect(screen.getByText('↑ 1')).toBeInTheDocument();
  });

  it('toggles LadderRowExpanded on row click', async () => {
    render(<LadderRow index={0} character={makeProfile()} cachedCharacters={[]} season={null} />);
    expect(screen.queryByTestId('ladder-row-expanded')).not.toBeInTheDocument();
    await userEvent.click(screen.getByText('Arthas'));
    expect(screen.getByTestId('ladder-row-expanded')).toBeInTheDocument();
    await userEvent.click(screen.getByText('Arthas'));
    expect(screen.queryByTestId('ladder-row-expanded')).not.toBeInTheDocument();
  });

  it('shows the equipped item level rounded down', () => {
    render(
      <LadderRow
        index={0}
        character={makeProfile({ equippedItemLevel: 335.8 })}
        cachedCharacters={[]}
        season={null}
      />,
    );
    expect(screen.getByText('335')).toBeInTheDocument();
  });

  it('shows the guild wrapped in angle brackets', () => {
    render(
      <LadderRow
        index={0}
        character={makeProfile({ guild: 'De Tardes' })}
        cachedCharacters={[]}
        season={null}
      />,
    );
    expect(screen.getByText('<De Tardes>')).toBeInTheDocument();
  });

  it('shows no guild when the character has none', () => {
    render(<LadderRow index={0} character={makeProfile()} cachedCharacters={[]} season={null} />);
    expect(screen.queryByText(/^<.*>$/)).not.toBeInTheDocument();
  });

  it('shows the race icon when an image exists for the race', () => {
    render(
      <LadderRow
        index={0}
        character={makeProfile({ race: 'Night Elf' })}
        cachedCharacters={[]}
        season={null}
      />,
    );
    expect(screen.getByAltText('Night Elf')).toHaveAttribute('src', 'nightelf.png');
  });

  it('shows no race icon when there is no image for the race', () => {
    render(
      <LadderRow
        index={0}
        character={makeProfile({ race: 'Human' })}
        cachedCharacters={[]}
        season={null}
      />,
    );
    expect(screen.queryByAltText('Human')).not.toBeInTheDocument();
  });
});
