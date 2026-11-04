const files = import.meta.glob<string>('/src/assets/races/*.png', {
  eager: true,
  import: 'default',
});

export const RACE_IMAGES: Record<string, string> = Object.fromEntries(
  Object.entries(files).map(([path, url]) => [path.split('/').pop()!.replace('.png', ''), url]),
);

export { normalizeKey as getRaceImageKey } from '@/features/views/utils.ts';
