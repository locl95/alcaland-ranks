// Folds case and accents, so "lucia" finds "Lúcía": accented names are common on EU realms.
const fold = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

export const matchesName = (name: string, search: string): boolean =>
  fold(name).includes(fold(search.trim()));
