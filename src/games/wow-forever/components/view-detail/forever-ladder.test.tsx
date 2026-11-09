import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ForeverCharacter, WowItem } from '@/games/wow-forever/api/forever-types.ts';
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
  items: [],
  ...overrides,
});

const RAGE_OF_THE_STORM: WowItem = {
  id: 280604,
  slot: 'Main Hand',
  quality: 'Rare',
  name: 'Rage of the Storm',
  level: 40,
  binding: 'Binds when picked up',
  requiredLevel: 0,
  itemSubclass: 'Mace',
  armor: null,
  stats: ['+12 Intellect', '+15 Stamina'],
  spells: ['Equip: Increases the damage dealt by your Stormstrike ability by 10%.'],
  sellPrice: { header: 'Sell Price:', gold: '1', silver: '62', copper: '35' },
  durability: 'Durability 98 / 100',
  weaponStats: {
    damage: '91 - 137 Damage',
    dps: '(35.6 damage per second)',
    attackSpeed: 'Speed 3.20',
  },
  icon: 'https://render.worldofwarcraft.com/forever-eu/icons/56/133522.jpg',
  enchantments: ['Windfury 1'],
};

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
    expect(row.getByText('Item level').parentElement).toHaveTextContent('Item level 18');
    expect(row.getByText('<TSALAB>')).toBeInTheDocument();
    expect(row.getByText('PvE')).toBeInTheDocument();
    expect(row.getByText('NA')).toBeInTheDocument();
    expect(row.getByText('Level').parentElement).toHaveTextContent('Level 22');
  });

  it('shows how long ago the character last logged in', () => {
    vi.useFakeTimers({ now: new Date('2026-11-08T20:00:00Z') });
    render(
      <ForeverLadder characters={[character('Daxan', 22)]} cachedCharacters={[]} pending={[]} />,
    );
    vi.useRealTimers();

    const lastLogin = within(rowOf('Daxan')).getByText('Last login').parentElement;
    expect(lastLogin).toHaveTextContent('Last login 3d');
    expect(lastLogin).toHaveAttribute('datetime', '2026-11-05T20:00:00Z');
  });

  it('opens and closes the equipment by clicking the row', async () => {
    const user = userEvent.setup();
    render(
      <ForeverLadder
        characters={[character('Daxan', 22, { items: [RAGE_OF_THE_STORM] })]}
        cachedCharacters={[]}
        pending={[]}
      />,
    );
    const toggle = within(rowOf('Daxan')).getByRole('button', { name: /Daxan Test/ });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await user.click(toggle);

    const equipment = screen.getByRole('region', { name: 'Equipment of Daxan Test' });
    expect(within(equipment).getByRole('button', { name: 'Rage of the Storm' })).toBeVisible();
    expect(within(equipment).getByRole('img', { name: 'Head: empty' })).toBeVisible();

    await user.click(toggle);
    expect(screen.queryByRole('region', { name: /Equipment/ })).not.toBeInTheDocument();
  });

  it("shows an item's details from its icon, as the game's tooltip does", async () => {
    const user = userEvent.setup();
    render(
      <ForeverLadder
        characters={[character('Daxan', 22, { items: [RAGE_OF_THE_STORM] })]}
        cachedCharacters={[]}
        pending={[]}
      />,
    );
    await user.click(within(rowOf('Daxan')).getByRole('button', { name: /Daxan Test/ }));

    await user.click(screen.getByRole('button', { name: 'Rage of the Storm' }));

    const tooltip = screen.getByRole('dialog');
    for (const line of [
      'Item Level 40',
      'Binds when picked up',
      'Main Hand',
      'Mace',
      '91 - 137 Damage',
      'Speed 3.20',
      '(35.6 damage per second)',
      '+15 Stamina',
      'Windfury 1',
      'Durability 98 / 100',
      'Equip: Increases the damage dealt by your Stormstrike ability by 10%.',
    ]) {
      expect(within(tooltip).getByText(line)).toBeInTheDocument();
    }
    // No requirement, no line for it.
    expect(within(tooltip).queryByText(/Requires Level/)).not.toBeInTheDocument();
    expect(within(tooltip).getByRole('img', { name: 'gold' })).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('says "No guild" for a character without one', () => {
    render(
      <ForeverLadder
        characters={[character('Siempre', 14, { guild: null })]}
        cachedCharacters={[]}
        pending={[]}
      />,
    );

    const row = within(rowOf('Siempre'));
    expect(row.getByText('No guild')).toBeInTheDocument();
    expect(row.queryByText(/</)).not.toBeInTheDocument();
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
