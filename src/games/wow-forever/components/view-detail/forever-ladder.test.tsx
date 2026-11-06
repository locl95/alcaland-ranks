import { render, screen, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ForeverCharacter } from '@/games/wow-forever/api/forever-types.ts';
import { ForeverLadder } from './forever-ladder.tsx';

// Only the Orc has race art here, as if just that PNG had been added.
vi.mock('@/shared/warcraft/race-images.ts', () => ({
  RACE_IMAGES: { orc: 'orc.png' } as Record<string, string>,
  getRaceImageKey: (race: string) => race.toLowerCase().replace(/\s+/g, ''),
}));

const character = (
  name: string,
  level: number,
  overrides: Partial<ForeverCharacter> = {},
): ForeverCharacter => ({
  type: 'wow_forever',
  id: level,
  name,
  surname: 'Test',
  region: 'eu',
  level,
  averageItemLevel: 20,
  equippedItemLevel: 18,
  characterClass: 'Warrior',
  race: 'Orc',
  gender: 'Female',
  faction: 'Horde',
  guild: 'TSALAB',
  experience: 0,
  ruleset: 'PvP',
  lastLogin: '2026-11-05T20:00:00Z',
  ...overrides,
});

const rowOf = (name: string) => screen.getByText(`${name} Test`).closest('li')!;
const imagesOf = (name: string) => within(rowOf(name)).getAllByRole('img');

describe('ForeverLadder', () => {
  it('shows each character with item level, guild, ruleset and region', () => {
    render(
      <ForeverLadder
        characters={[character('Daxan', 22, { region: 'us', ruleset: 'PvE' })]}
        cachedCharacters={[]}
        pending={[]}
      />,
    );

    const row = within(rowOf('Daxan'));
    expect(row.getByText('18')).toBeInTheDocument();
    expect(row.getByText('<TSALAB>')).toBeInTheDocument();
    expect(row.getByText('PvE')).toBeInTheDocument();
    expect(row.getByText('NA')).toBeInTheDocument();
    expect(row.getByText('Level', { exact: false }).parentElement).toHaveTextContent('Level 22');
  });

  it('leaves out the guild of a character without one', () => {
    render(
      <ForeverLadder
        characters={[character('Siempre', 14, { guild: null })]}
        cachedCharacters={[]}
        pending={[]}
      />,
    );

    expect(within(rowOf('Siempre')).queryByText(/</)).not.toBeInTheDocument();
  });

  it('shows the race with the class icon on its corner', () => {
    render(
      <ForeverLadder characters={[character('Daxan', 22)]} cachedCharacters={[]} pending={[]} />,
    );

    const [race, classBadge] = imagesOf('Daxan');
    expect(race).toHaveAttribute('alt', 'Orc');
    expect(race).toHaveAttribute('src', 'orc.png');
    expect(classBadge).toHaveAttribute('alt', 'Warrior');
  });

  it('shows the class icon alone for a race without art yet', () => {
    render(
      <ForeverLadder
        characters={[character('Siempre', 14, { race: 'Night Elf' })]}
        cachedCharacters={[]}
        pending={[]}
      />,
    );

    const images = imagesOf('Siempre');
    expect(images).toHaveLength(1);
    expect(images[0]).toHaveAttribute('alt', 'Warrior');
  });

  it('marks places and levels gained or lost since the last snapshot', () => {
    render(
      <ForeverLadder
        characters={[character('Riser', 20), character('Faller', 15)]}
        cachedCharacters={[character('Riser', 12), character('Faller', 14)]}
        pending={[]}
      />,
    );

    expect(within(rowOf('Riser')).getByText('↑ 1')).toBeInTheDocument();
    expect(within(rowOf('Riser')).getByText('+8')).toBeInTheDocument();
    expect(within(rowOf('Faller')).getByText('↓ 1')).toBeInTheDocument();
  });

  it('lists pending characters after the ladder, with their status instead of stats', () => {
    render(
      <ForeverLadder
        characters={[character('Daxan', 22)]}
        cachedCharacters={[]}
        pending={[
          { entity: { name: 'Brakk', surname: 'Test', region: 'eu' }, status: 'syncing' },
          { entity: { name: 'Siempre', surname: 'Test', region: 'eu' }, status: 'deleting' },
        ]}
      />,
    );

    const rows = screen.getAllByRole('listitem');
    expect(rows.map((r) => r.textContent)).toEqual([
      expect.stringContaining('Daxan Test'),
      expect.stringContaining('Brakk Test'),
      expect.stringContaining('Siempre Test'),
    ]);
    expect(within(rowOf('Brakk')).getByText('Syncing…')).toBeInTheDocument();
    expect(within(rowOf('Siempre')).getByText('Deleting…')).toBeInTheDocument();
    expect(within(rowOf('Brakk')).queryByText(/Level/)).not.toBeInTheDocument();
  });
});
