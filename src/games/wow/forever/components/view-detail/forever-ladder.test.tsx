import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import {
  ForeverCharacter,
  WowItem,
  WowStats,
  WowTalentTree,
} from '@/games/wow/forever/api/forever-types.ts';
import { ForeverLadder } from './forever-ladder.tsx';

// Only the Orc has race art here, as if just that PNG had been added.
vi.mock('@/games/wow/forever/assets/race-images.ts', () => ({
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
  talents: [],
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

const ENHANCEMENT: WowTalentTree = {
  name: 'Enhancement',
  points: 25,
  talents: [
    {
      name: 'Flurry',
      spellId: 16256,
      rank: 5,
      description:
        'Increases your attack speed by 30% for your next 3 swings after dealing a melee critical strike.',
      icon: 'https://render.worldofwarcraft.com/forever-eu/icons/56/132152.jpg',
    },
  ],
};

const WARRIOR_STATS: WowStats = {
  health: 388,
  resource: { type: 'Rage', value: 100 },
  strength: 42,
  agility: 26,
  intellect: 18,
  stamina: 45,
  spirit: 27,
  attackPower: 103,
  mainHandStats: { minDamage: 50.75, maxDamage: 63.75, speed: 3.5, dps: 16.357143 },
  offHandStats: { minDamage: 7.86, maxDamage: 7.86, speed: 2.0, dps: 3.93 },
  meleeCrit: 4.3342004,
  rangedCrit: 1.7742002,
  spellCrit: 0,
  spellPower: 0,
  spellPenetration: 0,
  manaRegen: 0,
  manaRegenCombat: 0,
  armor: 465,
  defense: 63,
  dodge: 4.2542005,
  parry: 4.92,
  block: 4.92,
  resistances: { fire: 0, shadow: 0, nature: 0, arcane: 0, frost: 0 },
};

const rowOf = (name: string) => screen.getByText(`${name} Test`).closest('li')!;
const imagesOf = (name: string) => within(rowOf(name)).getAllByRole('img');
const portraitOf = (name: string) => rowOf(name).querySelector('.forever-portrait-image');

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

  it('shows the talents trained in each specialization, main one first', async () => {
    const user = userEvent.setup();
    render(
      <ForeverLadder
        characters={[
          character('Daxan', 22, {
            characterClass: 'Shaman',
            talents: [{ name: 'Elemental', points: 5, talents: [] }, ENHANCEMENT],
          }),
        ]}
        cachedCharacters={[]}
        pending={[]}
      />,
    );
    await user.click(within(rowOf('Daxan')).getByRole('button', { name: /Daxan Test/ }));

    const talents = screen.getByRole('region', { name: 'Talents of Daxan Test' });
    const trees = within(talents).getAllByRole('heading');
    expect(trees.map((tree) => tree.parentElement!.textContent)).toEqual([
      'Enhancement25 points',
      'Elemental5 points',
    ]);

    await user.click(within(talents).getByRole('button', { name: 'Flurry, rank 5' }));
    const tooltip = screen.getByRole('dialog');
    expect(within(tooltip).getByText('Rank 5')).toBeInTheDocument();
    expect(within(tooltip).getByText(/Increases your attack speed by 30%/)).toBeInTheDocument();
  });

  it("shows the character's stats between the items", async () => {
    const user = userEvent.setup();
    render(
      <ForeverLadder
        characters={[character('Daxan', 22, { items: [RAGE_OF_THE_STORM], stats: WARRIOR_STATS })]}
        cachedCharacters={[]}
        pending={[]}
      />,
    );
    await user.click(within(rowOf('Daxan')).getByRole('button', { name: /Daxan Test/ }));

    const equipment = screen.getByRole('region', { name: 'Equipment of Daxan Test' });
    for (const title of ['Core', 'Offensive', 'Defensive', 'Resources', 'Resistances']) {
      expect(within(equipment).getByRole('heading', { name: title })).toBeVisible();
    }
    expect(within(equipment).getByText('Melee Crit').nextSibling).toHaveTextContent('4.33%');
    expect(within(equipment).getByText('Rage').nextSibling).toHaveTextContent('100');
  });

  it('says what has not synced yet instead of an empty sheet', async () => {
    const user = userEvent.setup();
    render(
      <ForeverLadder
        characters={[character('Daxan', 22, { items: null, talents: undefined })]}
        cachedCharacters={[]}
        pending={[]}
      />,
    );
    await user.click(within(rowOf('Daxan')).getByRole('button', { name: /Daxan Test/ }));

    expect(screen.getByText("Equipment hasn't synced yet.")).toBeVisible();
    expect(screen.getByText("Talents haven't synced yet.")).toBeVisible();
  });

  it('says so when no talent points are spent yet', async () => {
    const user = userEvent.setup();
    render(
      <ForeverLadder characters={[character('Daxan', 8)]} cachedCharacters={[]} pending={[]} />,
    );
    await user.click(within(rowOf('Daxan')).getByRole('button', { name: /Daxan Test/ }));

    expect(screen.getByText('No talent points spent yet.')).toBeVisible();
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

  it("shows Blizzard's render as the portrait, and the class and race beside the name", () => {
    render(
      <ForeverLadder
        characters={[character('Daxan', 22, { avatar: 'daxan-avatar.jpg' })]}
        cachedCharacters={[]}
        pending={[]}
      />,
    );

    expect(portraitOf('Daxan')).toHaveAttribute('src', 'daxan-avatar.jpg');
    const [classIcon, raceIcon] = imagesOf('Daxan');
    expect(classIcon).toHaveAttribute('alt', 'Warrior');
    expect(raceIcon).toHaveAttribute('alt', 'Orc');
    expect(raceIcon).toHaveAttribute('src', 'orc.png');
  });

  it('falls back to the race for the portrait, then to the class', () => {
    render(
      <ForeverLadder
        characters={[character('Daxan', 22), character('Siempre', 14, { race: 'Night Elf' })]}
        cachedCharacters={[]}
        pending={[]}
      />,
    );

    expect(portraitOf('Daxan')).toHaveAttribute('src', 'orc.png');
    expect(portraitOf('Siempre')).toHaveAttribute('src', expect.stringContaining('warrior'));
    // No race art for the Night Elf: just the class beside the name.
    expect(imagesOf('Siempre').map((image) => image.getAttribute('alt'))).toEqual(['Warrior']);
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
