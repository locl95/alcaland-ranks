const files = import.meta.glob<string>('/src/games/lol/assets/tiers/*.webp', {
  eager: true,
  import: 'default',
});

export const TIER_IMAGES: Record<string, string> = Object.fromEntries(
  Object.entries(files).map(([path, url]) => [
    path.split('/').pop()!.replace('.webp', '').toUpperCase(),
    url,
  ]),
);
