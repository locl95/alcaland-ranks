import deathknight from '@/shared/warcraft/assets/classes/deathknight.webp';
import demonhunter from '@/shared/warcraft/assets/classes/demonhunter.webp';
import druid from '@/shared/warcraft/assets/classes/druid.webp';
import evoker from '@/shared/warcraft/assets/classes/evoker.webp';
import hunter from '@/shared/warcraft/assets/classes/hunter.webp';
import mage from '@/shared/warcraft/assets/classes/mage.webp';
import monk from '@/shared/warcraft/assets/classes/monk.webp';
import paladin from '@/shared/warcraft/assets/classes/paladin.webp';
import priest from '@/shared/warcraft/assets/classes/priest.webp';
import rogue from '@/shared/warcraft/assets/classes/rogue.webp';
import shaman from '@/shared/warcraft/assets/classes/shaman.webp';
import warlock from '@/shared/warcraft/assets/classes/warlock.webp';
import warrior from '@/shared/warcraft/assets/classes/warrior.webp';

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

/** "Death Knight" → "deathknight", the key of CLASS_IMAGES. */
export const getClassImageKey = (className: string): string =>
  className.toLowerCase().replace(/\s+/g, '');
