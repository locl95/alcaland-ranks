import top from '@/assets/lol/positions/top.svg';
import jungle from '@/assets/lol/positions/jungle.svg';
import middle from '@/assets/lol/positions/middle.svg';
import bottom from '@/assets/lol/positions/bottom.svg';
import utility from '@/assets/lol/positions/utility.svg';
import { Position } from './lol-types.ts';

export const POSITIONS: { key: Position; label: string; icon: string }[] = [
  { key: 'TOP', label: 'Top', icon: top },
  { key: 'JUNGLE', label: 'Jungle', icon: jungle },
  { key: 'MIDDLE', label: 'Mid', icon: middle },
  { key: 'BOTTOM', label: 'ADC', icon: bottom },
  { key: 'UTILITY', label: 'Support', icon: utility },
];

export const positionOf = (key: string) => POSITIONS.find((p) => p.key === key);
