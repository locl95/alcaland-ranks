import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { ColumnSort } from '@/games/wow/column-sort.ts';
import './sort-header.css';

interface SortHeaderProps<K extends string> {
  label: string;
  sortKey: K;
  sort: ColumnSort<K>;
  onSort: (key: K) => void;
  className: string;
}

/** A column header that sorts the ladder by its column: ↕ says it can, ↓ or ↑ that it does. */
export function SortHeader<K extends string>({
  label,
  sortKey,
  sort,
  onSort,
  className,
}: Readonly<SortHeaderProps<K>>) {
  const active = sort.key === sortKey;
  const Arrow = !active ? ArrowUpDown : sort.direction === 'desc' ? ArrowDown : ArrowUp;

  return (
    <button
      type="button"
      className={`eyebrow ladder-sort-header ${className}`}
      data-active={active}
      onClick={() => onSort(sortKey)}
    >
      <Arrow className="ladder-sort-arrow" aria-hidden={true} />
      {label}
      {/* The ladder is a list, not a table, so aria-sort is not available. */}
      {active && (
        <span className="sr-only">
          , sorted {sort.direction === 'desc' ? 'descending' : 'ascending'}
        </span>
      )}
    </button>
  );
}
