import { useState } from 'react';
import {
  DEFAULT_PAGE_SIZE,
  PageSize,
  pageSizeOptions,
  resolvePageSize,
  rowsPerPage,
} from '@/features/views/model/page-size.ts';

/** One choice for every ladder, so a viewer who reads 25 at a time gets 25 everywhere. */
const STORAGE_KEY = 'ladder-page-size';

const isPageSize = (value: unknown): value is PageSize =>
  value === 10 || value === 25 || value === 50 || value === 'all';

// Storage can be unavailable (private mode, blocked site data): the default size is enough then.
function readPicked(): PageSize {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const value = raw === 'all' ? raw : Number(raw);
    return isPageSize(value) ? value : DEFAULT_PAGE_SIZE;
  } catch {
    return DEFAULT_PAGE_SIZE;
  }
}

/** The page size the viewer picked, resolved for a ladder of `total` rows, and remembered. */
export function usePageSize(total: number) {
  const [picked, setPicked] = useState<PageSize>(readPicked);
  const size = resolvePageSize(picked, total);

  const pick = (next: PageSize) => {
    setPicked(next);
    try {
      localStorage.setItem(STORAGE_KEY, String(next));
    } catch {
      // Not remembered, but still applied.
    }
  };

  return {
    size,
    options: pageSizeOptions(total),
    rowsPerPage: rowsPerPage(size, total),
    pick,
  };
}

export type PageSizeControl = ReturnType<typeof usePageSize>;
