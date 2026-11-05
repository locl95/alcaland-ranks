import deathknight from '@/games/wow/assets/classes/deathknight.webp';
import demonhunter from '@/games/wow/assets/classes/demonhunter.webp';
import druid from '@/games/wow/assets/classes/druid.webp';
import evoker from '@/games/wow/assets/classes/evoker.webp';
import hunter from '@/games/wow/assets/classes/hunter.webp';
import mage from '@/games/wow/assets/classes/mage.webp';
import monk from '@/games/wow/assets/classes/monk.webp';
import paladin from '@/games/wow/assets/classes/paladin.webp';
import priest from '@/games/wow/assets/classes/priest.webp';
import rogue from '@/games/wow/assets/classes/rogue.webp';
import shaman from '@/games/wow/assets/classes/shaman.webp';
import warlock from '@/games/wow/assets/classes/warlock.webp';
import warrior from '@/games/wow/assets/classes/warrior.webp';

export const CLASS_IMAGES: Record<string, string> = {
  deathknight,
  demonhunter,
  druid,
  evoker,
  hunter,
  mage,
  monk,
  paladin,
  priest,
  rogue,
  shaman,
  warlock,
  warrior,
};

export { normalizeKey as getClassImageKey } from '@/games/wow/utils.ts';
