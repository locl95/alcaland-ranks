import back from '@/games/wow-forever/assets/gear/back.webp';
import chest from '@/games/wow-forever/assets/gear/chest.webp';
import feet from '@/games/wow-forever/assets/gear/feet.webp';
import finger from '@/games/wow-forever/assets/gear/finger.webp';
import hands from '@/games/wow-forever/assets/gear/hands.webp';
import head from '@/games/wow-forever/assets/gear/head.webp';
import legs from '@/games/wow-forever/assets/gear/legs.webp';
import mainhand from '@/games/wow-forever/assets/gear/mainhand.webp';
import neck from '@/games/wow-forever/assets/gear/neck.webp';
import offhand from '@/games/wow-forever/assets/gear/offhand.webp';
import ranged from '@/games/wow-forever/assets/gear/ranged.webp';
import shirt from '@/games/wow-forever/assets/gear/shirt.webp';
import shoulders from '@/games/wow-forever/assets/gear/shoulders.webp';
import tabard from '@/games/wow-forever/assets/gear/tabard.webp';
import trinket from '@/games/wow-forever/assets/gear/trinket.webp';
import waist from '@/games/wow-forever/assets/gear/waist.webp';
import wrist from '@/games/wow-forever/assets/gear/wrist.webp';

/** The in-game empty-slot art, by the backend's slot name. */
export const EMPTY_SLOT_IMAGES: Record<string, string> = {
  Head: head,
  Neck: neck,
  Shoulders: shoulders,
  Back: back,
  Chest: chest,
  Shirt: shirt,
  Tabard: tabard,
  Wrist: wrist,
  Hands: hands,
  Waist: waist,
  Legs: legs,
  Feet: feet,
  'Ring 1': finger,
  'Ring 2': finger,
  'Trinket 1': trinket,
  'Trinket 2': trinket,
  'Main Hand': mainhand,
  'Off Hand': offhand,
  Ranged: ranged,
};
