/** A WoW Forever character is named by name + surname, within a region. */
export interface CharacterRef {
  name: string;
  surname: string;
  region: string;
}

export const characterKey = ({ name, surname, region }: CharacterRef): string =>
  `${name.trim().toLowerCase()}|${surname.trim().toLowerCase()}|${region.toLowerCase()}`;

export const formatCharacterName = ({ name, surname }: CharacterRef): string =>
  `${name.trim()} ${surname.trim()}`;

export const NOT_FOUND_HINT = 'Check the name, surname and region.';
