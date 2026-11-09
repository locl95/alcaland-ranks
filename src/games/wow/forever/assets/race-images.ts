// The game's race icons, from o7gg, named like the key ("nightelf.webp"). Kept to WoW
// Forever for now: race art for every Warcraft game goes in src/games/wow/assets/races/.
const files = import.meta.glob<string>('/src/games/wow/forever/assets/races/*.webp', {
  eager: true,
  import: 'default',
});

export const RACE_IMAGES: Record<string, string> = Object.fromEntries(
  Object.entries(files).map(([path, url]) => [path.split('/').pop()!.replace('.webp', ''), url]),
);

/** "Night Elf" → "nightelf", the key of RACE_IMAGES. */
export const getRaceImageKey = (race: string): string => race.toLowerCase().replace(/\s+/g, '');
