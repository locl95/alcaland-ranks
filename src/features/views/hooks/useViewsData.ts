import { useMemo, useState } from 'react';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/shared/components/toaster/toast.ts';
import { userRequest } from '@/shared/api/httpClient.ts';
import { View } from '@/features/views/model/view.ts';
import { Pagination } from '@/features/views/components/shared/pager.tsx';
import {
  viewKeys,
  fetchViews,
  fetchOwnViews,
  pollOperation,
  ViewsPage,
  VIEWS_PAGE_SIZE,
} from '@/features/views/api/viewQueries.ts';

function usePagedViews(
  keyForPage: (page: number) => readonly unknown[],
  fetchPage: (page: number) => Promise<ViewsPage>,
  enabled: boolean,
) {
  const [requestedPage, setRequestedPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: keyForPage(requestedPage),
    queryFn: () => fetchPage(requestedPage),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const knownTotal = data?.totalCount ?? null;
  const loadedCount = data?.views.length ?? 0;

  // We ask for include=metadata, so totalCount should always come back. When it does not,
  // fall back to what the current page proves: assume one more page whenever it came back
  // full, so later rows stay reachable instead of vanishing along with the pager.
  const pageCount =
    knownTotal !== null
      ? Math.max(1, Math.ceil(knownTotal / VIEWS_PAGE_SIZE))
      : requestedPage + (loadedCount === VIEWS_PAGE_SIZE ? 1 : 0);

  // Corrected during render rather than in an effect, so the out-of-range page is never
  // committed to the screen. Self-limiting: the next render has requestedPage === pageCount.
  if (requestedPage > pageCount) setRequestedPage(pageCount);

  const page = Math.min(requestedPage, pageCount);
  const startIndex = (page - 1) * VIEWS_PAGE_SIZE;

  const pagination: Pagination = {
    page,
    pageCount,
    startIndex,
    count: loadedCount,
    total: knownTotal ?? startIndex + loadedCount,
    goFirst: () => setRequestedPage(1),
    goPrev: () => setRequestedPage((p) => Math.max(1, Math.min(p, pageCount) - 1)),
    goNext: () => setRequestedPage((p) => Math.min(pageCount, Math.min(p, pageCount) + 1)),
    goLast: () => setRequestedPage(pageCount),
  };

  return { views: data?.views ?? [], isLoading, pagination };
}

export function useViewsData(isAuthenticated: boolean) {
  const queryClient = useQueryClient();
  const { showError } = useToast();
  const [pendingViews, setPendingViews] = useState<View[]>([]);
  const [deletingViewId, setDeletingViewId] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  const {
    views: featuredViews,
    isLoading: isLoadingFeatured,
    pagination: featuredPagination,
  } = usePagedViews(viewKeys.listPage, fetchViews, true);

  const {
    views: serverOwnViews,
    isLoading: isLoadingOwn,
    pagination: ownPagination,
  } = usePagedViews(viewKeys.ownListPage, fetchOwnViews, isAuthenticated);

  const ownViews = useMemo(() => {
    const serverIds = new Set(serverOwnViews.map((v) => v.simpleView.id));
    const stillPending = pendingViews.filter((v) => !serverIds.has(v.simpleView.id));
    const all = [...serverOwnViews, ...stillPending];
    return deletingViewId
      ? all.map((v) =>
          v.simpleView.id === deletingViewId ? { ...v, status: 'deleting' as const } : v,
        )
      : all;
  }, [serverOwnViews, pendingViews, deletingViewId]);

  const createView = (pendingView: View) => {
    setPendingViews((prev) => [...prev, pendingView]);

    pollOperation(pendingView.operationId!)
      .then((result) => {
        if (result.status === 'COMPLETED' && result.resourceId) {
          setPendingViews((prev) =>
            prev.map((v) =>
              v.operationId === pendingView.operationId
                ? { ...v, simpleView: { ...v.simpleView, id: result.resourceId! } }
                : v,
            ),
          );
          queryClient.invalidateQueries({ queryKey: viewKeys.ownList() });
        } else {
          setPendingViews((prev) => prev.filter((v) => v.operationId !== pendingView.operationId));
          if (result.status === 'COMPLETED') {
            queryClient.invalidateQueries({ queryKey: viewKeys.ownList() });
          } else {
            setCreateError('Failed to create ladder. Please try again.');
          }
        }
      })
      .catch(() => {
        setPendingViews((prev) => prev.filter((v) => v.operationId !== pendingView.operationId));
        queryClient.invalidateQueries({ queryKey: viewKeys.ownList() });
      });
  };

  const deleteView = async (viewId: string) => {
    setDeletingViewId(viewId);
    try {
      const { id: operationId } = await userRequest<{ id: string }>('DELETE', `/views/${viewId}`);
      await pollOperation(operationId);
    } catch {
      showError('Failed to delete ladder — please try again');
    } finally {
      setDeletingViewId(null);
      queryClient.invalidateQueries({ queryKey: viewKeys.ownList() });
    }
  };

  return {
    featuredViews,
    isLoadingFeatured,
    featuredPagination,
    ownViews,
    isLoadingOwn,
    ownPagination,
    createView,
    deleteView,
    deletingViewId,
    createError,
    clearCreateError: () => setCreateError(null),
  };
}
