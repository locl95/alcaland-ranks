/** A row of /views/{id}/data for WoW Forever. `id` is Blizzard's, not the entity's. */
export interface ForeverCharacter {
  type: 'wow_forever';
  id: number;
  name: string;
  surname: string;
  region: string;
  level: number;
  averageItemLevel: number;
  equippedItemLevel: number;
  characterClass: string;
  race: string;
  gender: string;
  faction: string;
  guild: string | null;
  experience: number;
  ruleset: string;
  lastLogin: string;
  /** Only what is equipped: an empty slot is simply missing. */
  items: WowItem[];
  /** One tree per specialization, with the talents trained in it. */
  talents: WowTalentTree[];
}

/** An equipped item, as Blizzard displays it: most fields are ready-made English text. */
export interface WowItem {
  id: number;
  /** "Head", "Ring 1", "Main Hand"… */
  slot: string;
  /** "Poor", "Common", "Uncommon", "Rare", "Epic", "Legendary". */
  quality: string;
  name: string;
  level: number;
  binding: string | null;
  /** 0 when there is no requirement. */
  requiredLevel: number;
  itemSubclass: string;
  armor: string | null;
  stats: string[];
  spells: string[];
  sellPrice: WowPrice | null;
  durability: string | null;
  weaponStats: WowWeaponStats | null;
  icon: string | null;
  enchantments: string[];
}

export interface WowPrice {
  header: string;
  gold: string;
  silver: string;
  copper: string;
}

export interface WowWeaponStats {
  damage: string;
  dps: string;
  attackSpeed: string;
}

export interface WowTalentTree {
  /** The specialization: "Enhancement", "Feral Combat"… */
  name: string;
  points: number;
  talents: WowTalent[];
}

export interface WowTalent {
  name: string;
  spellId: number;
  /** Points spent in this talent. Its maximum is not sent. */
  rank: number;
  description: string;
  icon: string | null;
}
