import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '@/shared/components/toaster/ToastProvider.tsx';
import { useViewsData } from './useViewsData.ts';
import { viewKeys } from '@/features/views/api/viewQueries.ts';
import { View } from '@/features/views/model/view.ts';
import { SimpleView } from '@/features/views/api/view-types.ts';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockServiceGet = vi.fn();
const mockUserRequest = vi.fn();
const mockPollOperation = vi.fn();

vi.mock('@/shared/api/httpClient.ts', () => ({
  serviceGet: (...args: unknown[]) => mockServiceGet(...args),
  userRequest: (...args: unknown[]) => mockUserRequest(...args),
}));

vi.mock('@/features/views/api/viewQueries.ts', async () => {
  const actual = await vi.importActual<typeof import('@/features/views/api/viewQueries.ts')>(
    '@/features/views/api/viewQueries.ts',
  );
  return { ...actual, pollOperation: (...args: unknown[]) => mockPollOperation(...args) };
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeSimpleView = (id: string, name: string): SimpleView => ({
  id,
  name,
  owner: 'testuser',
  published: true,
  entitiesIds: [],
  game: 'WOW',
  featured: false,
  extraArguments: null,
});

const makeView = (id: string, name: string, status: View['status'] = 'synced'): View => ({
  operationId: status === 'pending' ? id : null,
  simpleView: makeSimpleView(id, name),
  status,
});

const makeWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Infinity, gcTime: Infinity },
    },
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  );

  return { wrapper, queryClient };
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useViewsData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockServiceGet.mockResolvedValue({ records: [], metadata: { totalCount: 0 } });
    mockUserRequest.mockResolvedValue({ records: [], metadata: { totalCount: 0 } });
    mockPollOperation.mockResolvedValue({ id: 'op-123', status: 'COMPLETED' });
  });

  describe('featured views', () => {
    it('fetches featured views using serviceGet on mount', async () => {
      const { wrapper } = makeWrapper();
      renderHook(() => useViewsData(false), { wrapper });
      await waitFor(() =>
        expect(mockServiceGet).toHaveBeenCalledWith(
          '/views?game=wow&featured=true&page=1&limit=10&include=metadata',
        ),
      );
    });

    it('returns the featured views from the API', async () => {
      mockServiceGet.mockResolvedValue({
        records: [makeSimpleView('v1', 'Featured')],
        metadata: { totalCount: 1 },
      });
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useViewsData(false), { wrapper });
      await waitFor(() => expect(result.current.featuredViews).toHaveLength(1));
      expect(result.current.featuredViews[0].simpleView.id).toBe('v1');
    });
  });

  describe('own views', () => {
    it('does not fetch own views when not authenticated', async () => {
      const { wrapper } = makeWrapper();
      renderHook(() => useViewsData(false), { wrapper });
      await waitFor(() => expect(mockServiceGet).toHaveBeenCalled());
      expect(mockUserRequest).not.toHaveBeenCalled();
    });

    it('fetches own views using userRequest when authenticated', async () => {
      const { wrapper } = makeWrapper();
      renderHook(() => useViewsData(true), { wrapper });
      await waitFor(() =>
        expect(mockUserRequest).toHaveBeenCalledWith(
          'GET',
          '/views?game=wow&page=1&limit=10&include=metadata',
        ),
      );
    });

    it('returns the own views from the API', async () => {
      mockUserRequest.mockResolvedValue({
        records: [makeSimpleView('v1', 'My View')],
        metadata: { totalCount: 1 },
      });
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useViewsData(true), { wrapper });
      await waitFor(() => expect(result.current.ownViews).toHaveLength(1));
      expect(result.current.ownViews[0].simpleView.id).toBe('v1');
    });
  });

  describe('createView', () => {
    it('adds the pending view to the list immediately', async () => {
      mockPollOperation.mockReturnValue(new Promise(() => {}));
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useViewsData(true), { wrapper });

      await waitFor(() => expect(result.current.isLoadingOwn).toBe(false));

      const pending = makeView('op-123', 'New View', 'pending');
      act(() => result.current.createView(pending));

      await waitFor(() => expect(result.current.ownViews).toContainEqual(pending));
    });

    it('promotes the pending view to synced when the operation completes', async () => {
      mockPollOperation.mockResolvedValue({
        id: 'op-123',
        status: 'COMPLETED',
        resourceId: 'real-view-id',
      });
      mockUserRequest
        .mockResolvedValueOnce({ records: [], metadata: { totalCount: 0 } })
        .mockResolvedValue({
          records: [makeSimpleView('real-view-id', 'New View')],
          metadata: { totalCount: 1 },
        });

      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useViewsData(true), { wrapper });

      await waitFor(() => expect(result.current.isLoadingOwn).toBe(false));

      const pending = makeView('op-123', 'New View', 'pending');
      act(() => result.current.createView(pending));

      await waitFor(() => {
        const view = result.current.ownViews.find((v) => v.simpleView.name === 'New View');
        expect(view?.simpleView.id).toBe('real-view-id');
        expect(view?.status).toBe('synced');
      });
    });

    it('removes the pending view and sets createError when the operation fails', async () => {
      mockPollOperation.mockResolvedValue({ id: 'op-123', status: 'FAILED' });
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useViewsData(true), { wrapper });

      await waitFor(() => expect(result.current.isLoadingOwn).toBe(false));

      const pending = makeView('op-123', 'New View', 'pending');
      act(() => result.current.createView(pending));

      await waitFor(() => {
        expect(result.current.ownViews.find((v) => v.operationId === 'op-123')).toBeUndefined();
        expect(result.current.createError).not.toBeNull();
      });
    });

    it('clears createError when clearCreateError is called', async () => {
      mockPollOperation.mockResolvedValue({ id: 'op-123', status: 'FAILED' });
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useViewsData(true), { wrapper });

      await waitFor(() => expect(result.current.isLoadingOwn).toBe(false));

      act(() => result.current.createView(makeView('op-123', 'New View', 'pending')));
      await waitFor(() => expect(result.current.createError).not.toBeNull());

      act(() => result.current.clearCreateError());
      await waitFor(() => expect(result.current.createError).toBeNull());
    });

    it('removes the pending view and invalidates when polling throws a network error', async () => {
      mockPollOperation.mockRejectedValue(new Error('Network error'));
      const { wrapper, queryClient } = makeWrapper();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
      const { result } = renderHook(() => useViewsData(true), { wrapper });

      await waitFor(() => expect(result.current.isLoadingOwn).toBe(false));

      act(() => result.current.createView(makeView('op-123', 'New View', 'pending')));

      await waitFor(() => {
        expect(result.current.ownViews.find((v) => v.operationId === 'op-123')).toBeUndefined();
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: viewKeys.ownList() });
      });
      expect(result.current.createError).toBeNull();
    });

    it('keeps pending views in the list when a server refetch does not yet include them', async () => {
      mockPollOperation.mockReturnValue(new Promise(() => {}));
      mockUserRequest.mockResolvedValue({ records: [] });

      const { wrapper, queryClient } = makeWrapper();
      const { result } = renderHook(() => useViewsData(true), { wrapper });

      await waitFor(() => expect(result.current.isLoadingOwn).toBe(false));

      const pending = makeView('op-123', 'Pending View', 'pending');
      act(() => result.current.createView(pending));

      await waitFor(() =>
        expect(result.current.ownViews).toContainEqual(
          expect.objectContaining({ status: 'pending' }),
        ),
      );

      await act(async () => {
        await queryClient.invalidateQueries({ queryKey: viewKeys.ownList() });
      });

      await waitFor(() =>
        expect(result.current.ownViews).toContainEqual(
          expect.objectContaining({ status: 'pending' }),
        ),
      );
    });
  });

  describe('deleteView', () => {
    it('marks the view as deleting in ownViews while the operation is in flight', async () => {
      mockUserRequest.mockImplementation((method: string) => {
        if (method === 'DELETE') return new Promise(() => {});
        return Promise.resolve({ records: [makeSimpleView('v1', 'My View')] });
      });
      const { wrapper, queryClient } = makeWrapper();
      queryClient.setQueryData<View[]>(viewKeys.ownList(), [makeView('v1', 'My View')]);

      const { result } = renderHook(() => useViewsData(true), { wrapper });
      await waitFor(() => expect(result.current.ownViews).toHaveLength(1));

      act(() => {
        result.current.deleteView('v1');
      });

      expect(result.current.ownViews).toHaveLength(1);
      expect(result.current.ownViews[0].status).toBe('deleting');
    });

    it('sets deletingViewId while the operation is in flight', async () => {
      let resolveDelete!: (v: { id: string }) => void;
      mockUserRequest.mockImplementation((method: string) => {
        if (method === 'DELETE')
          return new Promise((res) => {
            resolveDelete = res;
          });
        return Promise.resolve({ records: [makeSimpleView('v1', 'My View')] });
      });
      const { wrapper, queryClient } = makeWrapper();
      queryClient.setQueryData<View[]>(viewKeys.ownList(), [makeView('v1', 'My View')]);

      const { result } = renderHook(() => useViewsData(true), { wrapper });

      act(() => {
        result.current.deleteView('v1');
      });
      await waitFor(() => expect(result.current.deletingViewId).toBe('v1'));

      await act(async () => resolveDelete({ id: 'op-123' }));
      await waitFor(() => expect(result.current.deletingViewId).toBeNull());
    });

    it('invalidates the own views list after a successful delete', async () => {
      const { wrapper, queryClient } = makeWrapper();
      queryClient.setQueryData<View[]>(viewKeys.ownList(), [makeView('v1', 'My View')]);
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useViewsData(true), { wrapper });

      await act(async () => result.current.deleteView('v1'));

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: viewKeys.ownList() });
    });

    it('still invalidates the own views list when the DELETE request fails', async () => {
      mockUserRequest.mockImplementation((method: string) => {
        if (method === 'DELETE') return Promise.reject(new Error('Server error'));
        return Promise.resolve({ records: [makeSimpleView('v1', 'My View')] });
      });
      const { wrapper, queryClient } = makeWrapper();
      queryClient.setQueryData<View[]>(viewKeys.ownList(), [makeView('v1', 'My View')]);
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useViewsData(true), { wrapper });

      await act(async () => result.current.deleteView('v1'));

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: viewKeys.ownList() });
    });

    it('still invalidates the own views list when the delete operation fails', async () => {
      mockPollOperation.mockResolvedValue({ id: 'op-123', status: 'FAILED' });
      const { wrapper, queryClient } = makeWrapper();
      queryClient.setQueryData<View[]>(viewKeys.ownList(), [makeView('v1', 'My View')]);
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useViewsData(true), { wrapper });

      await act(async () => result.current.deleteView('v1'));

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: viewKeys.ownList() });
    });
  });
});

describe('useViewsData — paging', () => {
  const pageOfViews = (page: number, totalCount: number) => ({
    records: [makeSimpleView(`v${page}`, `View page ${page}`)],
    metadata: { totalCount },
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockServiceGet.mockResolvedValue({ records: [], metadata: { totalCount: 0 } });
    mockPollOperation.mockResolvedValue({ id: 'op-123', status: 'COMPLETED' });
  });

  it('reports how many pages the server says there are', async () => {
    mockUserRequest.mockResolvedValue(pageOfViews(1, 45));
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useViewsData(true), { wrapper });

    await waitFor(() => expect(result.current.ownPagination.total).toBe(45));
    expect(result.current.ownPagination.pageCount).toBe(5);
    expect(result.current.ownPagination.page).toBe(1);
    expect(result.current.ownPagination.startIndex).toBe(0);
  });

  it('asks the server for the next page', async () => {
    mockUserRequest.mockResolvedValue(pageOfViews(1, 45));
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useViewsData(true), { wrapper });
    await waitFor(() => expect(result.current.ownViews).toHaveLength(1));

    mockUserRequest.mockResolvedValue(pageOfViews(2, 45));
    act(() => result.current.ownPagination.goNext());

    await waitFor(() =>
      expect(mockUserRequest).toHaveBeenCalledWith(
        'GET',
        '/views?game=wow&page=2&limit=10&include=metadata',
      ),
    );
    expect(result.current.ownPagination.page).toBe(2);
    expect(result.current.ownPagination.startIndex).toBe(10);
  });

  it('steps back when the page it is on no longer exists', async () => {
    mockUserRequest.mockResolvedValue(pageOfViews(1, 45));
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useViewsData(true), { wrapper });
    await waitFor(() => expect(result.current.ownPagination.pageCount).toBe(5));

    mockUserRequest.mockResolvedValue(pageOfViews(2, 45));
    act(() => result.current.ownPagination.goNext());
    await waitFor(() => expect(result.current.ownPagination.page).toBe(2));

    mockUserRequest.mockResolvedValue({ records: [], metadata: { totalCount: 12 } });
    act(() => result.current.ownPagination.goNext());

    await waitFor(() =>
      expect(mockUserRequest).toHaveBeenCalledWith(
        'GET',
        '/views?game=wow&page=3&limit=10&include=metadata',
      ),
    );
    await waitFor(() => expect(result.current.ownPagination.page).toBe(2));
  });

  it('keeps later pages reachable when the server omits the total', async () => {
    // The backend is asked for include=metadata; if it answers without it we must not
    // silently strand every row past the first page.
    mockUserRequest.mockResolvedValue({
      records: Array.from({ length: 10 }, (_, i) => makeSimpleView(`v${i + 1}`, `View ${i + 1}`)),
    });
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useViewsData(true), { wrapper });

    await waitFor(() => expect(result.current.ownViews).toHaveLength(10));
    expect(result.current.ownPagination.pageCount).toBe(2);

    mockUserRequest.mockResolvedValue({
      records: [makeSimpleView('v11', 'View 11')],
    });
    act(() => result.current.ownPagination.goNext());

    await waitFor(() =>
      expect(mockUserRequest).toHaveBeenCalledWith(
        'GET',
        '/views?game=wow&page=2&limit=10&include=metadata',
      ),
    );
    await waitFor(() => expect(result.current.ownPagination.total).toBe(11));
    expect(result.current.ownPagination.pageCount).toBe(2);
  });

  it('stays on one page when a short page arrives without a total', async () => {
    mockUserRequest.mockResolvedValue({
      records: [makeSimpleView('v1', 'View 1')],
    });
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useViewsData(true), { wrapper });

    await waitFor(() => expect(result.current.ownViews).toHaveLength(1));

    expect(result.current.ownPagination.pageCount).toBe(1);
    expect(result.current.ownPagination.total).toBe(1);
  });

  it('asks the server for the last page, then the first', async () => {
    mockUserRequest.mockResolvedValue(pageOfViews(1, 45));
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useViewsData(true), { wrapper });
    await waitFor(() => expect(result.current.ownPagination.pageCount).toBe(5));

    act(() => result.current.ownPagination.goLast());

    await waitFor(() =>
      expect(mockUserRequest).toHaveBeenCalledWith(
        'GET',
        '/views?game=wow&page=5&limit=10&include=metadata',
      ),
    );
    expect(result.current.ownPagination.page).toBe(5);
    expect(result.current.ownPagination.startIndex).toBe(40);

    act(() => result.current.ownPagination.goFirst());

    await waitFor(() => expect(result.current.ownPagination.page).toBe(1));
    expect(result.current.ownPagination.startIndex).toBe(0);
  });

  it('counts the server page, not the pending views merged into it', async () => {
    mockPollOperation.mockReturnValue(new Promise(() => {}));
    mockUserRequest.mockResolvedValue(pageOfViews(1, 45));
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useViewsData(true), { wrapper });

    await waitFor(() => expect(result.current.ownPagination.count).toBe(1));

    act(() => result.current.createView(makeView('op-123', 'Pending View', 'pending')));

    await waitFor(() => expect(result.current.ownViews).toHaveLength(2));
    expect(result.current.ownPagination.count).toBe(1);
  });

  it('pages the featured list separately from the own list', async () => {
    mockServiceGet.mockResolvedValue(pageOfViews(1, 45));
    mockUserRequest.mockResolvedValue(pageOfViews(1, 45));
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useViewsData(true), { wrapper });
    await waitFor(() => expect(result.current.featuredPagination.pageCount).toBe(5));

    act(() => result.current.featuredPagination.goNext());

    await waitFor(() => expect(result.current.featuredPagination.page).toBe(2));
    expect(result.current.ownPagination.page).toBe(1);
  });
});
