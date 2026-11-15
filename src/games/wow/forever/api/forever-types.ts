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
  // The four below are missing when Blizzard could not be asked and nothing was cached.
  /** Only what is equipped: an empty slot is simply missing. */
  items?: WowItem[] | null;
  /** One tree per specialization, with the talents trained in it. */
  talents?: WowTalentTree[] | null;
  stats?: WowStats | null;
  /** Blizzard's render of the character's face. */
  avatar?: string | null;
  /** Missing on characters synced before the backend sent it. */
  pvp?: WowPvp | null;
  /** Missing on characters synced before the backend sent it. */
  professions?: WowProfessions | null;
}

export interface WowProfessions {
  /** Mining, Blacksmithing… */
  primaries: WowProfession[];
  /** Cooking, Fishing, First Aid. */
  secondaries: WowProfession[];
}

export interface WowProfession {
  id: number;
  name: string;
  skillPoints: number;
  /** The cap of the rank trained so far, not of the profession. */
  maxSkillPoints: number;
  icon: string | null;
}

export interface WowPvp {
  honorableKills: number;
  /** 0 to 14. It stays 0 until enough honorable kills earn rank 1. */
  rank: number;
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

/** The character pane's numbers, as the game computes them. Percentages are unrounded. */
export interface WowStats {
  health: number;
  /** Rage, Mana or Energy, by class. */
  resource: { type: string; value: number };
  strength: number;
  agility: number;
  intellect: number;
  stamina: number;
  spirit: number;
  attackPower: number;
  mainHandStats: WowWeaponDamage;
  /** Filled in even with nothing in the off hand: it is then an unarmed swing. */
  offHandStats: WowWeaponDamage;
  meleeCrit: number;
  rangedCrit: number;
  spellCrit: number;
  spellPower: number;
  spellPenetration: number;
  manaRegen: number;
  manaRegenCombat: number;
  armor: number;
  defense: number;
  dodge: number;
  parry: number;
  block: number;
  resistances: WowResistances;
}

export interface WowWeaponDamage {
  minDamage: number;
  maxDamage: number;
  speed: number;
  dps: number;
}

export interface WowResistances {
  fire: number;
  nature: number;
  shadow: number;
  arcane: number;
  frost?: number | null;
  holy?: number | null;
}
