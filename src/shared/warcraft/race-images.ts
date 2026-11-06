// Race art is added as PNGs in assets/races/, named like the key ("nightelf.png"); a race
// without a file is simply missing from the map.
const files = import.meta.glob<string>('/src/shared/warcraft/assets/races/*.png', {
  eager: true,
  import: 'default',
});

export const RACE_IMAGES: Record<string, string> = Object.fromEntries(
  Object.entries(files).map(([path, url]) => [path.split('/').pop()!.replace('.png', ''), url]),
);

/** "Night Elf" → "nightelf", the key of RACE_IMAGES. */
export const getRaceImageKey = (race: string): string => race.toLowerCase().replace(/\s+/g, '');
