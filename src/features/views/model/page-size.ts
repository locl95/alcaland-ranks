/** How many rows a ladder page shows: a fixed size, or the whole ladder. */
export type PageSize = 10 | 25 | 50 | 'all';

const SIZES = [10, 25, 50] as const;

/** Past this many rows a ladder is easier to search and filter than to scroll through whole. */
export const MAX_SHOW_ALL = 100;

export const DEFAULT_PAGE_SIZE: PageSize = 10;

/**
 * The sizes worth offering for a ladder of `total` rows: each one smaller than the ladder, and
 * "all" while it is short enough to scroll. A ladder that fits one page gets none.
 */
export function pageSizeOptions(total: number): PageSize[] {
  if (total <= SIZES[0]) return [];
  const sizes: PageSize[] = SIZES.filter((size) => size < total);
  return total <= MAX_SHOW_ALL ? [...sizes, 'all'] : sizes;
}

/**
 * The option a ladder shows for the size the viewer picked, which may come from a ladder of
 * another size: "all" on a ladder too long for it falls back to the largest size, and a size
 * the whole ladder fits in is "all".
 */
export function resolvePageSize(picked: PageSize, total: number): PageSize {
  const options = pageSizeOptions(total);
  if (options.length === 0) return DEFAULT_PAGE_SIZE;
  if (picked === 'all') return options.includes('all') ? 'all' : options[options.length - 1];
  return picked >= total ? 'all' : picked;
}

/** The rows per page for a resolved size. */
export const rowsPerPage = (size: PageSize, total: number): number =>
  size === 'all' ? Math.max(total, 1) : size;
