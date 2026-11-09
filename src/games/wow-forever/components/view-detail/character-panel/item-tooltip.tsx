import { CSSProperties } from 'react';
import { WowItem } from '@/games/wow-forever/api/forever-types.ts';
import { ITEM_QUALITY_COLORS } from '@/games/wow-forever/constants/item-quality.ts';
import { formatEnchantment, slotLabel } from '@/games/wow-forever/model/item.ts';
import { SellPrice } from './sell-price.tsx';
import './item-tooltip.css';

/** The item's details, line by line in the order the game's tooltip uses. */
export function ItemTooltip({ item }: Readonly<{ item: WowItem }>) {
  return (
    <div
      className="item-tooltip"
      style={{ '--quality-color': ITEM_QUALITY_COLORS[item.quality] } as CSSProperties}
    >
      <p className="game-tooltip-title item-tooltip-name">{item.name}</p>
      <p className="item-tooltip-level">Item Level {item.level}</p>
      {item.binding && <p>{item.binding}</p>}
      <p className="item-tooltip-pair">
        <span>{slotLabel(item.slot)}</span>
        {item.itemSubclass !== 'Miscellaneous' && <span>{item.itemSubclass}</span>}
      </p>
      {item.weaponStats && (
        <>
          <p className="item-tooltip-pair">
            <span>{item.weaponStats.damage}</span>
            <span>{item.weaponStats.attackSpeed}</span>
          </p>
          <p>{item.weaponStats.dps}</p>
        </>
      )}
      {item.armor && <p>{item.armor}</p>}
      {item.stats.map((stat) => (
        <p key={stat}>{stat}</p>
      ))}
      {item.enchantments.map((enchantment) => (
        <p key={enchantment} className="item-tooltip-effect">
          {formatEnchantment(enchantment)}
        </p>
      ))}
      {item.durability && <p>{item.durability}</p>}
      {item.requiredLevel > 0 && <p>Requires Level {item.requiredLevel}</p>}
      {item.spells.map((spell) => (
        <p key={spell} className="item-tooltip-effect">
          {spell}
        </p>
      ))}
      {item.sellPrice && <SellPrice price={item.sellPrice} />}
    </div>
  );
}
