import { describe, it, expect } from 'vitest';
import { WowItem } from '@/games/wow/forever/api/forever-types.ts';
import { formatEnchantment, itemsBySlot, slotLabel } from './item.ts';

describe('itemsBySlot', () => {
  it('finds each item by its slot', () => {
    const hood = { slot: 'Head', name: "Brawler's Leather Hood" } as WowItem;
    const ring = { slot: 'Ring 2', name: 'Band of the Fist' } as WowItem;

    const bySlot = itemsBySlot([hood, ring]);

    expect(bySlot.get('Head')).toBe(hood);
    expect(bySlot.get('Ring 2')).toBe(ring);
    expect(bySlot.get('Neck')).toBeUndefined();
  });
});

describe('slotLabel', () => {
  it.each([
    ['Ring 1', 'Ring'],
    ['Trinket 2', 'Trinket'],
    ['Main Hand', 'Main Hand'],
  ])('%s → %s', (slot, label) => {
    expect(slotLabel(slot)).toBe(label);
  });
});

describe('formatEnchantment', () => {
  it.each([
    ['Enchanted: Stamina +3 and Armor +24', 'Stamina +3 and Armor +24'],
    ['Crusader (Rank 1)', 'Crusader'],
    ['Windfury 1', 'Windfury 1'],
  ])('%s → %s', (enchantment, shown) => {
    expect(formatEnchantment(enchantment)).toBe(shown);
  });
});
