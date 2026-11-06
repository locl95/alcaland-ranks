import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ForeverCharacter } from '@/games/wow-forever/api/forever-types.ts';
import { ForeverLadder } from './forever-ladder.tsx';

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
  avatar: `https://render.example/${name}.jpg`,
  lastLogin: '2026-11-05T20:00:00Z',
  ...overrides,
});

const rowOf = (name: string) => screen.getByText(`${name} Test`).closest('li')!;
// The avatar is decorative (alt=""), so it is not an accessible img: query the DOM.
const imagesOf = (name: string) => [...rowOf(name).querySelectorAll('img')];

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

  it('shows the avatar with the class icon on its corner', () => {
    render(
      <ForeverLadder characters={[character('Daxan', 22)]} cachedCharacters={[]} pending={[]} />,
    );

    expect(imagesOf('Daxan')[0]).toHaveAttribute('src', 'https://render.example/Daxan.jpg');
    expect(within(rowOf('Daxan')).getByAltText('Warrior')).toBeInTheDocument();
  });

  it('names the class on the icon that stands in for a missing or broken avatar', () => {
    render(
      <ForeverLadder
        characters={[character('Siempre', 14, { avatar: null }), character('Daxan', 22)]}
        cachedCharacters={[]}
        pending={[]}
      />,
    );
    fireEvent.error(imagesOf('Daxan')[0]);

    for (const name of ['Siempre', 'Daxan']) {
      const images = imagesOf(name);
      expect(images).toHaveLength(1);
      expect(images[0]).toHaveAttribute('alt', 'Warrior');
    }
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
