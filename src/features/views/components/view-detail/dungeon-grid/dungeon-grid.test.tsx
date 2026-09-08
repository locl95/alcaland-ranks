import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DungeonGrid } from './dungeon-grid.tsx';
import { MythicPlusBestRun, RaiderioProfile, Season } from '@/features/views/api/raiderio.ts';

vi.mock('./character-run.tsx', () => ({
  CharacterRun: ({ character, isHighest }: { character: RaiderioProfile; isHighest: boolean }) => (
    <div data-testid={`run-${character.id}`}>{`${character.name}${isHighest ? ' *' : ''}`}</div>
  ),
}));

const DUNGEON = 'ARAK';

const season = {
  dungeons: [{ name: 'Ara-Kara', short_name: DUNGEON, challenge_mode_id: 1, icon_url: 'i.png' }],
} as Season;

const makeBestRun = (score: number, clearTimeMs: number): MythicPlusBestRun =>
  ({ run: { short_name: DUNGEON, score, clear_time_ms: clearTimeMs } }) as MythicPlusBestRun;

const makeProfile = (id: number, name: string, bestRun?: MythicPlusBestRun): RaiderioProfile =>
  ({ id, name, mythicPlusBestRuns: bestRun ? [bestRun] : [] }) as RaiderioProfile;

const rowText = () => screen.getAllByTestId(/^run-/).map((row) => row.textContent);

const renderGrid = (profiles: RaiderioProfile[]) =>
  render(<DungeonGrid raiderioProfiles={profiles} raiderioCachedProfiles={[]} season={season} />);

describe('DungeonGrid', () => {
  it('sorts each dungeon by its own score, then by clear time', () => {
    const slow = makeProfile(1, 'Slow', makeBestRun(200, 2000));
    const fast = makeProfile(2, 'Fast', makeBestRun(200, 1000));
    const best = makeProfile(3, 'Best', makeBestRun(300, 3000));

    renderGrid([slow, fast, best]);

    expect(rowText()).toEqual(['Best *', 'Fast', 'Slow']);
  });

  it('keeps a dungeon leader on the card, however low they sit in the overall ladder', () => {
    const profiles = Array.from({ length: 15 }, (_, i) =>
      makeProfile(i + 1, `Char${i + 1}`, makeBestRun(100 + i, 1000)),
    );

    renderGrid(profiles);

    expect(screen.getAllByTestId(/^run-/)).toHaveLength(10);
    expect(rowText()[0]).toBe('Char15 *');
  });
});
