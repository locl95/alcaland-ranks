/** A WoW Forever character is named by name + surname, within a region. */
export interface CharacterRef {
  name: string;
  surname: string;
  region: string;
}

/** Just the identifying fields, from a /data row or a form row. */
export const toCharacterRef = ({ name, surname, region }: CharacterRef): CharacterRef => ({
  name,
  surname,
  region,
});

export const isCompleteCharacter = ({ name, surname }: CharacterRef): boolean =>
  !!name.trim() && !!surname.trim();

export const characterKey = ({ name, surname, region }: CharacterRef): string =>
  `${name.trim().toLowerCase()}|${surname.trim().toLowerCase()}|${region.toLowerCase()}`;

export const formatCharacterName = ({ name, surname }: CharacterRef): string =>
  `${name.trim()} ${surname.trim()}`;

export const NOT_FOUND_HINT = 'Check the name, surname and region.';
