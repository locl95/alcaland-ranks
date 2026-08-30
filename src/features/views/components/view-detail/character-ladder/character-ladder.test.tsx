import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { CharacterLadder } from './character-ladder.tsx';
import { RaiderioProfile } from '@/features/views/api/raiderio.ts';

vi.mock('./ladder-row.tsx', () => ({
  LadderRow: ({ character, index }: { character: RaiderioProfile; index: number }) => (
    <div data-testid={`ladder-row-${character.id}`}>
      #{index + 1} {character.name}
    </div>
  ),
}));

vi.mock('@/assets/keystone.webp', () => ({ default: 'keystone.webp' }));

const makeProfile = (id: number, name: string, score: number): RaiderioProfile => ({
  id,
  name,
  realm: 'Tarren Mill',
  region: 'eu',
  score,
  class: 'Warrior',
  spec: 'Arms',
  quantile: 1,
  mythicPlusBestRuns: [],
  mythicPlusRecentRuns: [],
  mythicPlusRanks: {
    overall: { world: 1, region: 1, realm: 1 },
    class: { world: 1, region: 1, realm: 1 },
    specs: [],
  },
});

const makeLadder = (count: number) =>
  Array.from({ length: count }, (_, i) => makeProfile(i + 1, `Char${i + 1}`, 3000 - i * 10));

const renderLadder = (characters: RaiderioProfile[], cachedCharacters: RaiderioProfile[] = []) =>
  render(
    <CharacterLadder characters={characters} cachedCharacters={cachedCharacters} season={null} />,
  );

describe('CharacterLadder', () => {
  it('sorts characters by score descending', () => {
    renderLadder([makeProfile(2, 'Low', 1000), makeProfile(1, 'High', 3000)]);

    // The mock renders "#{index+1} {name}" — index 0 means rank #1 position
    expect(screen.getByTestId('ladder-row-1').textContent).toBe('#1 High');
    expect(screen.getByTestId('ladder-row-2').textContent).toBe('#2 Low');
  });

  it('collapses and expands on header click', async () => {
    renderLadder([makeProfile(1, 'Arthas', 3000)]);
    expect(screen.getByTestId('ladder-row-1')).toBeInTheDocument();

    await userEvent.click(screen.getByText('Ladder'));
    expect(screen.queryByTestId('ladder-row-1')).not.toBeInTheDocument();

    await userEvent.click(screen.getByText('Ladder'));
    expect(screen.getByTestId('ladder-row-1')).toBeInTheDocument();
  });
});

describe('CharacterLadder — paging', () => {
  it('shows no pager while everyone fits on one page', () => {
    renderLadder(makeLadder(10));

    expect(screen.getAllByTestId(/^ladder-row-/)).toHaveLength(10);
    expect(screen.queryByRole('navigation', { name: /pages$/i })).not.toBeInTheDocument();
  });

  it('pages the ladder, numbering rows from the page offset', async () => {
    renderLadder(makeLadder(15));

    expect(screen.getAllByTestId(/^ladder-row-/)).toHaveLength(10);
    expect(screen.getByText('1–10 of 15')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Next page' }));

    expect(screen.getByText('11–15 of 15')).toBeInTheDocument();
    expect(screen.getAllByTestId(/^ladder-row-/).map((row) => row.textContent)).toEqual([
      '#11 Char11',
      '#12 Char12',
      '#13 Char13',
      '#14 Char14',
      '#15 Char15',
    ]);
  });

  it('collapses the pager along with the rows it pages', async () => {
    renderLadder(makeLadder(15));
    expect(screen.getByRole('navigation', { name: 'Ladder pages' })).toBeInTheDocument();

    await userEvent.click(screen.getByText('Ladder'));

    expect(screen.queryByTestId('ladder-row-1')).not.toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Ladder pages' })).not.toBeInTheDocument();
    expect(screen.queryByText('1–10 of 15')).not.toBeInTheDocument();
  });
});
