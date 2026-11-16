import { useCallback, useMemo, useState } from 'react';
import { Pagination } from '@/features/views/components/shared/pager.tsx';

export const ENTITY_PAGE_SIZE = 10;

export function useEntityPage<T>(items: T[], pageSize = ENTITY_PAGE_SIZE) {
  const [requestedPage, setRequestedPage] = useState(1);

  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requestedPage, pageCount);
  const startIndex = (page - 1) * pageSize;

  const pageItems = useMemo(
    () => items.slice(startIndex, startIndex + pageSize),
    [items, startIndex, pageSize],
  );

  const goFirst = useCallback(() => setRequestedPage(1), []);
  const goLast = useCallback(() => setRequestedPage(pageCount), [pageCount]);

  const goPrev = useCallback(
    () => setRequestedPage((p) => Math.max(1, Math.min(p, pageCount) - 1)),
    [pageCount],
  );
  const goNext = useCallback(
    () => setRequestedPage((p) => Math.min(pageCount, Math.min(p, pageCount) + 1)),
    [pageCount],
  );

  const pagination: Pagination = {
    page,
    pageCount,
    startIndex,
    count: pageItems.length,
    total,
    goFirst,
    goPrev,
    goNext,
    goLast,
  };

  return { pageItems, startIndex, pagination };
}
