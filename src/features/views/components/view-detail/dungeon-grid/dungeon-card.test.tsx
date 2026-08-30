import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { DungeonCard } from './dungeon-card.tsx';
import { MythicPlusBestRun, RaiderioProfile, Season } from '@/features/views/api/raiderio.ts';

vi.mock('./character-run.tsx', () => ({
  CharacterRun: ({ character, isHighest }: { character: RaiderioProfile; isHighest: boolean }) => (
    <div data-testid={`run-${character.id}`}>{`${character.name}${isHighest ? ' *' : ''}`}</div>
  ),
}));

const dungeon: Season['dungeons'][number] = {
  name: 'Ara-Kara',
  short_name: 'ARAK',
  challenge_mode_id: 1,
  icon_url: 'i.png',
};

const makeScore = (id: number, score: number) => ({
  character: { id, name: `Char${id}` } as RaiderioProfile,
  bestRun: { run: { short_name: 'ARAK', score, clear_time_ms: 1000 } } as MythicPlusBestRun,
});

const makeScores = (count: number) =>
  Array.from({ length: count }, (_, i) => makeScore(i + 1, 300 - i));

const renderCard = (characterScores: ReturnType<typeof makeScores>) =>
  render(
    <DungeonCard
      dungeon={dungeon}
      characterScores={characterScores}
      winningRun={characterScores[0].bestRun!.run}
      cachedProfiles={[]}
    />,
  );

const rowText = () => screen.getAllByTestId(/^run-/).map((row) => row.textContent);

describe('DungeonCard', () => {
  it('shows no pager while every character fits on one page', () => {
    renderCard(makeScores(10));

    expect(screen.getAllByTestId(/^run-/)).toHaveLength(10);
    expect(screen.queryByRole('navigation', { name: /pages$/i })).not.toBeInTheDocument();
  });

  it('pages this dungeon on its own', async () => {
    renderCard(makeScores(15));

    expect(screen.getAllByTestId(/^run-/)).toHaveLength(10);
    expect(screen.getByText('1–10 of 15')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Next page' }));

    expect(screen.getByText('11–15 of 15')).toBeInTheDocument();
    expect(rowText()).toEqual(['Char11', 'Char12', 'Char13', 'Char14', 'Char15']);
  });

  it('crowns this dungeon leader on the first page', () => {
    renderCard(makeScores(15));

    expect(rowText()[0]).toBe('Char1 *');
  });
});
