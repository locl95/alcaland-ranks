// Specialization icons, named "<class>_<spec>.webp" with Retail's spec names.
const modules = import.meta.glob('@/games/wow/assets/specs/*.webp', {
  eager: true,
  import: 'default',
});

export const SPEC_IMAGES: Record<string, string> = Object.fromEntries(
  Object.entries(modules).map(([path, url]) => {
    const key = path.split('/').pop()!.replace('.webp', '');
    return [key, url as string];
  }),
);

const normalizeKey = (s: string): string => s.toLowerCase().replace(/\s+/g, '');

/** ("Death Knight", "Frost") → "deathknight_frost", the key of SPEC_IMAGES. */
export const getSpecImageKey = (className: string, specName: string): string =>
  `${normalizeKey(className)}_${normalizeKey(specName)}`;
