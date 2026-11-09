import { WowPrice } from '@/games/wow/forever/api/forever-types.ts';
import { COIN_IMAGES } from '@/games/wow/forever/assets/coin-images.ts';
import './sell-price.css';

const COINS = ['gold', 'silver', 'copper'] as const;

export function SellPrice({ price }: Readonly<{ price: WowPrice }>) {
  return (
    <p className="sell-price">
      {price.header}
      {COINS.filter((coin) => price[coin] !== '0').map((coin) => (
        <span key={coin} className="sell-price-coin">
          {price[coin]}
          <img src={COIN_IMAGES[coin]} alt={coin} />
        </span>
      ))}
    </p>
  );
}
