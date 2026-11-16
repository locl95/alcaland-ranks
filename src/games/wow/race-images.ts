// Race art is added in assets/races/, one per race and gender, named "<race>_<gender>.webp"
// ("nightelf_female.webp"); a race without a file is simply missing.
const files = import.meta.glob<string>('/src/games/wow/assets/races/*.webp', {
  eager: true,
  import: 'default',
});

/** Keyed by file name: "nightelf_female". */
export const RACE_IMAGES: Record<string, string> = Object.fromEntries(
  Object.entries(files).map(([path, url]) => [path.split('/').pop()!.replace('.webp', ''), url]),
);

/** "Night Elf" → "nightelf", the race part of a RACE_IMAGES key. */
export const getRaceImageKey = (race: string): string => race.toLowerCase().replace(/\s+/g, '');

const GENDERS = ['female', 'male'];

/** Every race with art, in a fixed order, so each one's filter icon never changes. */
const RACES = [...new Set(Object.keys(RACE_IMAGES).map((key) => key.split('_')[0]))].sort();

/**
 * The icon that stands for a whole race, as in a filter that takes in both genders.
 * Races alternate between the female and the male art, so together they show both.
 */
export function getRaceFilterImage(race: string): string | undefined {
  const key = getRaceImageKey(race);
  const index = RACES.indexOf(key);
  if (index === -1) return undefined;
  return (
    RACE_IMAGES[`${key}_${GENDERS[index % 2]}`] ?? RACE_IMAGES[`${key}_${GENDERS[(index + 1) % 2]}`]
  );
}

/** A character's own race art, by gender ("Female", "Male"); the race's icon if that is missing. */
export const getRaceImage = (race: string, gender: string): string | undefined =>
  RACE_IMAGES[`${getRaceImageKey(race)}_${gender.toLowerCase()}`] ?? getRaceFilterImage(race);
