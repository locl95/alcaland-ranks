import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useEntityPage, ENTITY_PAGE_SIZE } from './useEntityPage.ts';

const makeItems = (count: number) => Array.from({ length: count }, (_, i) => `item${i + 1}`);

describe('useEntityPage', () => {
  it('keeps everything on one page when there is no more than a full page', () => {
    const { result } = renderHook(() => useEntityPage(makeItems(ENTITY_PAGE_SIZE)));

    expect(result.current.pageCount).toBe(1);
    expect(result.current.page).toBe(1);
    expect(result.current.startIndex).toBe(0);
    expect(result.current.pageItems).toHaveLength(ENTITY_PAGE_SIZE);
    expect(result.current.total).toBe(ENTITY_PAGE_SIZE);
  });

  it('preserves the order it is given', () => {
    const { result } = renderHook(() => useEntityPage(['c', 'a', 'b']));

    expect(result.current.pageItems).toEqual(['c', 'a', 'b']);
  });

  it('splits 15 items into two pages and offsets the second', () => {
    const { result } = renderHook(() => useEntityPage(makeItems(15)));

    expect(result.current.pageCount).toBe(2);
    expect(result.current.pageItems).toEqual(makeItems(15).slice(0, 10));

    act(() => result.current.goNext());

    expect(result.current.page).toBe(2);
    expect(result.current.startIndex).toBe(10);
    expect(result.current.pageItems).toEqual(makeItems(15).slice(10));
  });

  it('goes back to the previous page', () => {
    const { result } = renderHook(() => useEntityPage(makeItems(15)));

    act(() => result.current.goNext());
    act(() => result.current.goPrev());

    expect(result.current.page).toBe(1);
    expect(result.current.startIndex).toBe(0);
  });

  it('does not move past either end', () => {
    const { result } = renderHook(() => useEntityPage(makeItems(15)));

    act(() => result.current.goPrev());
    expect(result.current.page).toBe(1);

    act(() => result.current.goNext());
    act(() => result.current.goNext());
    expect(result.current.page).toBe(2);
  });

  it('clamps back to the last page when the list shrinks under the current page', () => {
    const { result, rerender } = renderHook(({ items }) => useEntityPage(items), {
      initialProps: { items: makeItems(15) },
    });

    act(() => result.current.goNext());
    expect(result.current.page).toBe(2);

    rerender({ items: makeItems(8) });

    expect(result.current.page).toBe(1);
    expect(result.current.pageCount).toBe(1);
    expect(result.current.startIndex).toBe(0);
    expect(result.current.pageItems).toHaveLength(8);
  });

  it('keeps its page controls stable across renders, so memoised lists do not re-render', () => {
    const items = makeItems(15);
    const { result, rerender } = renderHook(() => useEntityPage(items));
    const { goPrev, goNext } = result.current;

    rerender();

    expect(result.current.goPrev).toBe(goPrev);
    expect(result.current.goNext).toBe(goNext);
  });
});
