import { WowItem, WowStats } from '@/games/wow/forever/api/forever-types.ts';

export interface StatLine {
  label: string;
  value: string;
}

export interface StatGroup {
  title: string;
  lines: StatLine[];
}

const percent = (value: number) => `${value.toFixed(2)}%`;
const decimal = (value: number) => value.toFixed(2);
const whole = (value: number) => String(Math.round(value));

/** Only an off-hand weapon has damage of its own; otherwise the backend sends an unarmed swing. */
export const hasOffHandWeapon = (items: WowItem[] | null | undefined): boolean =>
  !!items?.some((item) => item.slot === 'Off Hand' && item.weaponStats !== null);

/**
 * The character pane's stats in the groups o7gg used. Lines that do not apply
 * to the character (no spell crit on a warrior, no off-hand DPS without an
 * off-hand weapon) are left out.
 */
export function statGroups(stats: WowStats, offHandWeapon: boolean): StatGroup[] {
  const ifAny = (value: number, line: StatLine) => (value > 0 ? [line] : []);

  return [
    {
      title: 'Core',
      lines: [
        { label: 'Strength', value: whole(stats.strength) },
        { label: 'Agility', value: whole(stats.agility) },
        { label: 'Stamina', value: whole(stats.stamina) },
        { label: 'Intellect', value: whole(stats.intellect) },
        { label: 'Spirit', value: whole(stats.spirit) },
      ],
    },
    {
      title: 'Offensive',
      lines: [
        { label: 'Attack Power', value: whole(stats.attackPower) },
        { label: 'Main Hand DPS', value: decimal(stats.mainHandStats.dps) },
        ...(offHandWeapon
          ? [{ label: 'Off Hand DPS', value: decimal(stats.offHandStats.dps) }]
          : []),
        ...ifAny(stats.meleeCrit, { label: 'Melee Crit', value: percent(stats.meleeCrit) }),
        ...ifAny(stats.rangedCrit, { label: 'Ranged Crit', value: percent(stats.rangedCrit) }),
        ...ifAny(stats.spellCrit, { label: 'Spell Crit', value: percent(stats.spellCrit) }),
        ...ifAny(stats.spellPower, { label: 'Spell Power', value: whole(stats.spellPower) }),
      ],
    },
    {
      title: 'Defensive',
      lines: [
        { label: 'Armor', value: whole(stats.armor) },
        { label: 'Defense', value: whole(stats.defense) },
        { label: 'Dodge', value: percent(stats.dodge) },
        { label: 'Parry', value: percent(stats.parry) },
        { label: 'Block', value: percent(stats.block) },
      ],
    },
    {
      title: 'Resources',
      lines: [
        { label: 'Health', value: whole(stats.health) },
        { label: stats.resource.type, value: whole(stats.resource.value) },
        ...ifAny(stats.manaRegen, { label: 'Mana Regen', value: whole(stats.manaRegen) }),
      ],
    },
  ];
}

/** The resistances in the game's order; one the backend does not send is left out. */
export function resistanceLines({ resistances }: WowStats): StatLine[] {
  const all: [string, number | null | undefined][] = [
    ['Arcane', resistances.arcane],
    ['Fire', resistances.fire],
    ['Nature', resistances.nature],
    ['Frost', resistances.frost],
    ['Shadow', resistances.shadow],
    ['Holy', resistances.holy],
  ];
  return all
    .filter((entry): entry is [string, number] => typeof entry[1] === 'number')
    .map(([label, value]) => ({ label, value: whole(value) }));
}
