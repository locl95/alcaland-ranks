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
}
