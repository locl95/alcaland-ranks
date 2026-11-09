import { WowItem } from '@/games/wow-forever/api/forever-types.ts';

export const itemsBySlot = (items: WowItem[]): Map<string, WowItem> =>
  new Map(items.map((item) => [item.slot, item]));

/** "Ring 1" → "Ring": the number only tells the two slots apart. */
export const slotLabel = (slot: string): string => slot.replace(/ \d$/, '');

/** Blizzard's enchantment text as the game shows it: no "Enchanted:" prefix, no rank in brackets. */
export function formatEnchantment(enchantment: string): string {
  if (enchantment.includes('(')) return enchantment.split('(')[0].trim();
  if (enchantment.includes(':')) return enchantment.split(':')[1].trim();
  return enchantment;
}
