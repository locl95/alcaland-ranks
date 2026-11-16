/** Which column a Warcraft ladder is sorted by, and which way. */
export interface ColumnSort<K extends string> {
  key: K;
  direction: 'asc' | 'desc';
}

/** A new column sorts highest first; the active one flips. */
export const nextSort = <K extends string>(sort: ColumnSort<K>, key: K): ColumnSort<K> =>
  sort.key === key
    ? { key, direction: sort.direction === 'desc' ? 'asc' : 'desc' }
    : { key, direction: 'desc' };
