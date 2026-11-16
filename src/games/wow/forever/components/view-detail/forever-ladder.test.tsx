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

// Only the Orc has race art here, as if just its files had been added.
vi.mock('@/games/wow/race-images.ts', () => ({
  getRaceImage: (race: string, gender: string) =>
    race === 'Orc' ? `orc_${gender.toLowerCase()}.webp` : undefined,
  getRaceFilterImage: (race: string) => (race === 'Orc' ? 'orc.webp' : undefined),
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

  it('shows the PvP rank and honorable kills once there is a kill, even at rank 0', async () => {
    const user = userEvent.setup();
    render(
      <ForeverLadder
        characters={[character('Daxan', 43, { pvp: { honorableKills: 68, rank: 0 } })]}
        cachedCharacters={[]}
        pending={[]}
      />,
    );
    await user.click(within(rowOf('Daxan')).getByRole('button', { name: /Daxan Test/ }));

    const pvp = screen.getByRole('region', { name: 'PvP of Daxan Test' });
    expect(within(pvp).getByText('Rank 0')).toBeVisible();
    expect(pvp).toHaveTextContent('68 honorable kills');
  });

  it('says why there is no PvP to show: no kills yet, or not synced', async () => {
    const user = userEvent.setup();
    render(
      <ForeverLadder
        characters={[
          character('Daxan', 43, { pvp: { honorableKills: 0, rank: 0 } }),
          character('Bolado', 25),
        ]}
        cachedCharacters={[]}
        pending={[]}
      />,
    );
    await user.click(within(rowOf('Daxan')).getByRole('button', { name: /Daxan Test/ }));
    await user.click(within(rowOf('Bolado')).getByRole('button', { name: /Bolado Test/ }));

    expect(within(rowOf('Daxan')).getByText('No honorable kills yet.')).toBeVisible();
    expect(within(rowOf('Bolado')).getByText("PvP hasn't synced yet.")).toBeVisible();
    expect(screen.queryByRole('region', { name: /^PvP of/ })).not.toBeInTheDocument();
  });

  it('shows the professions with their skill, primary ones first', async () => {
    const user = userEvent.setup();
    render(
      <ForeverLadder
        characters={[
          character('Daxan', 43, {
            professions: {
              primaries: [
                { id: 186, name: 'Mining', skillPoints: 202, maxSkillPoints: 225, icon: null },
              ],
              secondaries: [
                { id: 185, name: 'Cooking', skillPoints: 4, maxSkillPoints: 75, icon: null },
              ],
            },
          }),
        ]}
        cachedCharacters={[]}
        pending={[]}
      />,
    );
    await user.click(within(rowOf('Daxan')).getByRole('button', { name: /Daxan Test/ }));

    const professions = screen.getByRole('region', { name: 'Professions of Daxan Test' });
    expect(
      within(professions)
        .getAllByRole('list')
        .map((group) => [group.getAttribute('aria-label'), group.textContent]),
    ).toEqual([
      ['Primary professions', '202'],
      ['Secondary professions', '4'],
    ]);

    await user.click(within(professions).getByRole('button', { name: 'Mining, 202 of 225' }));
    const tooltip = screen.getByRole('dialog');
    expect(tooltip).toHaveTextContent('MiningSkill (202/225)');
  });

  it('says why there are no professions to show: none learned, or not synced', async () => {
    const user = userEvent.setup();
    render(
      <ForeverLadder
        characters={[
          character('Daxan', 43, { professions: { primaries: [], secondaries: [] } }),
          character('Bolado', 25),
        ]}
        cachedCharacters={[]}
        pending={[]}
      />,
    );
    await user.click(within(rowOf('Daxan')).getByRole('button', { name: /Daxan Test/ }));
    await user.click(within(rowOf('Bolado')).getByRole('button', { name: /Bolado Test/ }));

    expect(within(rowOf('Daxan')).getByText('No professions learned yet.')).toBeVisible();
    expect(within(rowOf('Bolado')).getByText("Professions haven't synced yet.")).toBeVisible();
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
    expect(raceIcon).toHaveAttribute('src', 'orc_female.webp');
  });

  it('shows the item levels gained since the last snapshot', () => {
    render(
      <ForeverLadder
        characters={[character('Daxan', 22, { equippedItemLevel: 24 })]}
        cachedCharacters={[character('Daxan', 22, { equippedItemLevel: 18 })]}
        pending={[]}
      />,
    );

    expect(screen.getByTitle('Item levels gained since the last snapshot')).toHaveTextContent('+6');
  });

  it("shows the race art for the character's gender", () => {
    render(
      <ForeverLadder
        characters={[character('Daxan', 22, { gender: 'Male' })]}
        cachedCharacters={[]}
        pending={[]}
      />,
    );

    expect(imagesOf('Daxan')[1]).toHaveAttribute('src', 'orc_male.webp');
  });

  it('falls back to the race for the portrait, then to the class', () => {
    render(
      <ForeverLadder
        characters={[character('Daxan', 22), character('Siempre', 14, { race: 'Night Elf' })]}
        cachedCharacters={[]}
        pending={[]}
      />,
    );

    expect(portraitOf('Daxan')).toHaveAttribute('src', 'orc_female.webp');
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

  it('filters by character name, keeping each row in its real place', async () => {
    render(
      <ForeverLadder
        characters={[character('Daxan', 22), character('Lúcía', 20), character('Brakk', 18)]}
        cachedCharacters={[]}
        pending={[{ entity: { name: 'Dax', surname: 'Alt', region: 'eu' }, status: 'syncing' }]}
      />,
    );

    await userEvent.type(screen.getByRole('searchbox', { name: 'Search character' }), 'lucia');

    const rows = screen.getAllByRole('listitem');
    expect(rows).toHaveLength(1);
    expect(rows[0].querySelector('.forever-row-position')).toHaveTextContent('2');
    expect(rows[0]).toHaveTextContent('Lúcía Test');

    await userEvent.clear(screen.getByRole('searchbox'));
    await userEvent.type(screen.getByRole('searchbox'), 'dax');
    expect(screen.getAllByRole('listitem').map((r) => r.textContent)).toEqual([
      expect.stringContaining('Daxan Test'),
      expect.stringContaining('Dax Alt'),
    ]);

    await userEvent.type(screen.getByRole('searchbox'), 'zzz');
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
    expect(screen.getByText('No characters match.')).toBeInTheDocument();
  });

  it('filters by class and race, offering only those in the ladder, with their icons', async () => {
    render(
      <ForeverLadder
        characters={[
          character('Daxan', 22),
          character('Siempre', 20, { characterClass: 'Druid', race: 'Night Elf' }),
          character('Brakk', 18, { characterClass: 'Druid', race: 'Orc' }),
        ]}
        cachedCharacters={[]}
        pending={[{ entity: { name: 'Dax', surname: 'Alt', region: 'eu' }, status: 'syncing' }]}
      />,
    );
    const names = () =>
      screen.getAllByRole('listitem').map((r) => r.querySelector('.forever-row-name')!.textContent);
    const classes = within(screen.getByRole('group', { name: 'Class' }));

    expect(classes.getAllByRole('button').map((b) => b.getAttribute('aria-label'))).toEqual([
      'Druid',
      'Warrior',
    ]);
    expect(classes.getByRole('button', { name: 'Druid' }).querySelector('img')).not.toBeNull();
    await userEvent.click(classes.getByRole('button', { name: 'Druid' }));
    expect(classes.getByRole('button', { name: 'Druid' })).toHaveAttribute('aria-pressed', 'true');
    expect(names()).toEqual(['Siempre Test', 'Brakk Test']);
    expect(rowOf('Brakk').querySelector('.forever-row-position')).toHaveTextContent('3');

    // Class and race combine. Only the Orc has race art in this test: the Night Elf shows letters.
    // The filter's icon stands for the whole race, whatever each character's gender.
    const races = within(screen.getByRole('group', { name: 'Race' }));
    const orc = races.getByRole('button', { name: 'Orc' });
    expect(orc.querySelector('img')).toHaveAttribute('src', 'orc.webp');
    expect(races.getByRole('button', { name: 'Night Elf' })).toHaveTextContent('Ni');
    await userEvent.click(orc);
    expect(names()).toEqual(['Brakk Test']);
    expect(orc).toHaveAttribute('aria-pressed', 'true');

    // Clicking a picked icon again clears it.
    await userEvent.click(classes.getByRole('button', { name: 'Druid' }));
    await userEvent.click(orc);
    expect(names()).toEqual(['Daxan Test', 'Siempre Test', 'Brakk Test', 'Dax Alt']);
  });

  it('shows a chevron that flips when the row opens', async () => {
    render(
      <ForeverLadder characters={[character('Daxan', 22)]} cachedCharacters={[]} pending={[]} />,
    );
    const row = rowOf('Daxan').querySelector('button')!;
    expect(row.querySelector('.lucide-chevron-down')).toBeInTheDocument();

    await userEvent.click(row);

    expect(row.querySelector('.lucide-chevron-up')).toBeInTheDocument();
  });

  it('sorts by item level or level from the column headers, keeping real places', async () => {
    render(
      <ForeverLadder
        characters={[
          character('Daxan', 22, { equippedItemLevel: 30 }),
          character('Siempre', 20, { equippedItemLevel: 50 }),
          character('Brakk', 18, { equippedItemLevel: 40 }),
        ]}
        cachedCharacters={[]}
        pending={[]}
      />,
    );
    const rows = () =>
      screen
        .getAllByRole('listitem')
        .map(
          (r) =>
            `${r.querySelector('.forever-row-position')!.textContent} ${r.querySelector('.forever-row-name')!.textContent}`,
        );

    expect(screen.getByRole('button', { name: 'Level, sorted descending' })).toBeInTheDocument();
    expect(rows()).toEqual(['1 Daxan Test', '2 Siempre Test', '3 Brakk Test']);

    await userEvent.click(screen.getByRole('button', { name: 'iLvl' }));
    expect(rows()).toEqual(['2 Siempre Test', '3 Brakk Test', '1 Daxan Test']);
    expect(screen.getByRole('button', { name: 'Level' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'iLvl, sorted descending' }));
    expect(rows()).toEqual(['1 Daxan Test', '3 Brakk Test', '2 Siempre Test']);

    await userEvent.click(screen.getByRole('button', { name: 'Level' }));
    await userEvent.click(screen.getByRole('button', { name: 'Level, sorted descending' }));
    expect(screen.getByRole('button', { name: 'Level, sorted ascending' })).toBeInTheDocument();
    expect(rows()).toEqual(['3 Brakk Test', '2 Siempre Test', '1 Daxan Test']);
  });

  it('stops filtering by a class the ladder no longer has', async () => {
    const daxan = character('Daxan', 22);
    const brakk = character('Brakk', 18, { characterClass: 'Druid' });
    const { rerender } = render(
      <ForeverLadder characters={[daxan, brakk]} cachedCharacters={[]} pending={[]} />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Druid' }));

    rerender(<ForeverLadder characters={[daxan]} cachedCharacters={[]} pending={[]} />);

    // A single class leaves nothing to filter, so its bar hides too.
    expect(screen.queryByRole('group', { name: 'Class' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
  });
});
