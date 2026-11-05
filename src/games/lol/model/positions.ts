import top from '@/games/lol/assets/positions/top.svg';
import jungle from '@/games/lol/assets/positions/jungle.svg';
import middle from '@/games/lol/assets/positions/middle.svg';
import bottom from '@/games/lol/assets/positions/bottom.svg';
import utility from '@/games/lol/assets/positions/utility.svg';
import { Position } from '@/games/lol/api/lol-types.ts';

export const POSITIONS: { key: Position; label: string; icon: string }[] = [
  { key: 'TOP', label: 'Top', icon: top },
  { key: 'JUNGLE', label: 'Jungle', icon: jungle },
  { key: 'MIDDLE', label: 'Mid', icon: middle },
  { key: 'BOTTOM', label: 'ADC', icon: bottom },
  { key: 'UTILITY', label: 'Support', icon: utility },
];

export const positionOf = (key: string) => POSITIONS.find((p) => p.key === key);
