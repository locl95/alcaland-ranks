import { describe, it, expect } from 'vitest';
import { WowItem, WowStats } from '@/games/wow/forever/api/forever-types.ts';
import { hasOffHandWeapon, resistanceLines, statGroups } from './stats.ts';

// A level 13 warrior, as the backend sends it.
const WARRIOR: WowStats = {
  health: 388,
  resource: { type: 'Rage', value: 100 },
  strength: 42,
  agility: 26,
  intellect: 18,
  stamina: 45,
  spirit: 27,
  attackPower: 103,
  mainHandStats: { minDamage: 50.75, maxDamage: 63.75, speed: 3.5, dps: 16.357143 },
  offHandStats: { minDamage: 7.8571434, maxDamage: 7.8571434, speed: 2.0, dps: 3.9285717 },
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

const linesOf = (title: string, offHandWeapon = false) =>
  statGroups(WARRIOR, offHandWeapon).find((group) => group.title === title)!.lines;

describe('statGroups', () => {
  it('groups the stats as Core, Offensive, Defensive and Resources', () => {
    expect(statGroups(WARRIOR, false).map((group) => group.title)).toEqual([
      'Core',
      'Offensive',
      'Defensive',
      'Resources',
    ]);
  });

  it('rounds percentages and DPS to two decimals', () => {
    expect(linesOf('Offensive')).toContainEqual({ label: 'Melee Crit', value: '4.33%' });
    expect(linesOf('Offensive')).toContainEqual({ label: 'Main Hand DPS', value: '16.36' });
    expect(linesOf('Defensive')).toContainEqual({ label: 'Dodge', value: '4.25%' });
  });

  it('leaves out what does not apply: spell stats on a warrior, an unarmed off hand', () => {
    const labels = linesOf('Offensive').map((line) => line.label);
    expect(labels).toEqual(['Attack Power', 'Main Hand DPS', 'Melee Crit', 'Ranged Crit']);
    expect(linesOf('Resources').map((line) => line.label)).toEqual(['Health', 'Rage']);
  });

  it('shows off-hand DPS with an off-hand weapon', () => {
    expect(linesOf('Offensive', true)).toContainEqual({ label: 'Off Hand DPS', value: '3.93' });
  });

  it('shows spell power as a number, not a percentage', () => {
    const caster = statGroups({ ...WARRIOR, spellPower: 123 }, false);
    expect(caster[1].lines).toContainEqual({ label: 'Spell Power', value: '123' });
  });
});

describe('hasOffHandWeapon', () => {
  const offHand = (weaponStats: WowItem['weaponStats']) =>
    ({ slot: 'Off Hand', weaponStats }) as WowItem;

  it('is true for an off-hand weapon only', () => {
    expect(hasOffHandWeapon([offHand({ damage: '', dps: '', attackSpeed: '' })])).toBe(true);
    // A shield or a held-in-off-hand item has no damage.
    expect(hasOffHandWeapon([offHand(null)])).toBe(false);
    expect(hasOffHandWeapon([])).toBe(false);
    expect(hasOffHandWeapon(null)).toBe(false);
  });
});

describe('resistanceLines', () => {
  it('lists the resistances sent, in the game order', () => {
    expect(resistanceLines(WARRIOR).map((line) => line.label)).toEqual([
      'Arcane',
      'Fire',
      'Nature',
      'Frost',
      'Shadow',
    ]);
  });
});
