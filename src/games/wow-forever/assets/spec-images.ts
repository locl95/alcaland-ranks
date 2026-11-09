// The Classic talent trees, named like the key ("shaman_enhancement.webp"). Combat
// and Feral Combat have no Classic art of their own: they use Retail's Outlaw and Feral.
const files = import.meta.glob<string>('/src/games/wow-forever/assets/specs/*.webp', {
  eager: true,
  import: 'default',
});

export const SPEC_IMAGES: Record<string, string> = Object.fromEntries(
  Object.entries(files).map(([path, url]) => [path.split('/').pop()!.replace('.webp', ''), url]),
);

const toKey = (name: string) => name.toLowerCase().replace(/\s+/g, '');

/** ("Shaman", "Feral Combat") → "shaman_feralcombat", the key of SPEC_IMAGES. */
export const getSpecImageKey = (characterClass: string, tree: string): string =>
  `${toKey(characterClass)}_${toKey(tree)}`;
