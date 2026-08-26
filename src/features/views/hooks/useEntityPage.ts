import { useCallback, useMemo, useState } from 'react';

export const ENTITY_PAGE_SIZE = 10;

export function useEntityPage<T>(items: T[]) {
  const [requestedPage, setRequestedPage] = useState(1);

  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / ENTITY_PAGE_SIZE));
  const page = Math.min(requestedPage, pageCount);
  const startIndex = (page - 1) * ENTITY_PAGE_SIZE;

  const pageItems = useMemo(
    () => items.slice(startIndex, startIndex + ENTITY_PAGE_SIZE),
    [items, startIndex],
  );

  const goPrev = useCallback(
    () => setRequestedPage((p) => Math.max(1, Math.min(p, pageCount) - 1)),
    [pageCount],
  );
  const goNext = useCallback(
    () => setRequestedPage((p) => Math.min(pageCount, Math.min(p, pageCount) + 1)),
    [pageCount],
  );

  return { pageItems, startIndex, page, pageCount, total, goPrev, goNext };
}
