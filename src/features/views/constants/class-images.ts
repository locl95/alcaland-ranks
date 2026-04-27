import deathknight from "@/assets/classes/deathknight.webp";
import demonhunter from "@/assets/classes/demonhunter.webp";
import druid from "@/assets/classes/druid.webp";
import evoker from "@/assets/classes/evoker.webp";
import hunter from "@/assets/classes/hunter.webp";
import mage from "@/assets/classes/mage.webp";
import monk from "@/assets/classes/monk.webp";
import paladin from "@/assets/classes/paladin.webp";
import priest from "@/assets/classes/priest.webp";
import rogue from "@/assets/classes/rogue.webp";
import shaman from "@/assets/classes/shaman.webp";
import warlock from "@/assets/classes/warlock.webp";
import warrior from "@/assets/classes/warrior.webp";

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

export const getClassImageKey = (className: string): string =>
  className.toLowerCase().replace(/\s+/g, "");
