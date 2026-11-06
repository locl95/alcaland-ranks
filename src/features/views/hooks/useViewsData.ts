import { useEffect, useMemo, useRef, useState } from 'react';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/shared/components/toaster/toast.ts';
import { userRequest } from '@/shared/api/httpClient.ts';
import { View } from '@/features/views/model/view.ts';
import { Pagination } from '@/features/views/components/shared/pager.tsx';
import { GameSlug } from '@/shared/game/game.ts';
import {
  viewKeys,
  fetchOwnViews,
  pollOperation,
  ViewsPage,
  VIEWS_PAGE_SIZE,
} from '@/features/views/api/viewQueries.ts';

const GUILD_POLL_INTERVAL_MS = 5000;
const GUILD_MAX_POLL_ATTEMPTS = 12;
const BACKGROUND_POLL_INTERVAL_MS = 15000;
const BACKGROUND_MAX_POLL_ATTEMPTS = 20;

function usePagedViews(
  keyForPage: (page: number) => readonly unknown[],
  fetchPage: (page: number) => Promise<ViewsPage>,
  enabled: boolean,
) {
  const [requestedPage, setRequestedPage] = useState(1);

  const { data: queryData, isLoading } = useQuery({
    queryKey: keyForPage(requestedPage),
    queryFn: () => fetchPage(requestedPage),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const data = enabled ? queryData : undefined;

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

export function useViewsData(isAuthenticated: boolean, game: GameSlug) {
  const queryClient = useQueryClient();
  const { showError, showInfo } = useToast();
  const [pendingViews, setPendingViews] = useState<View[]>([]);
  const [incompleteViewIds, setIncompleteViewIds] = useState<Set<string>>(new Set());
  const [deletingViewId, setDeletingViewId] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [wasAuthenticated, setWasAuthenticated] = useState(isAuthenticated);

  if (wasAuthenticated !== isAuthenticated) {
    setWasAuthenticated(isAuthenticated);
    if (!isAuthenticated) {
      setPendingViews([]);
      setIncompleteViewIds(new Set());
      setCreateError(null);
    }
  }

  const sessionAbortController = useRef(new AbortController());
  useEffect(() => {
    if (isAuthenticated) return;
    sessionAbortController.current.abort();
    sessionAbortController.current = new AbortController();
  }, [isAuthenticated]);

  const {
    views: serverOwnViews,
    isLoading: isLoadingOwn,
    pagination: ownPagination,
  } = usePagedViews(
    (page) => viewKeys.ownListPage(game, page),
    (page) => fetchOwnViews(game, page),
    isAuthenticated,
  );

  const ownViews = useMemo(() => {
    const serverIds = new Set(serverOwnViews.map((v) => v.simpleView.id));
    const stillPending = pendingViews.filter((v) => !serverIds.has(v.simpleView.id));
    const all = [...serverOwnViews, ...stillPending].map((v) =>
      incompleteViewIds.has(v.simpleView.id) ? { ...v, status: 'incomplete' as const } : v,
    );
    return deletingViewId
      ? all.map((v) =>
          v.simpleView.id === deletingViewId ? { ...v, status: 'deleting' as const } : v,
        )
      : all;
  }, [serverOwnViews, pendingViews, deletingViewId, incompleteViewIds]);

  const removeIncomplete = (viewId: string) =>
    setIncompleteViewIds((prev) => {
      const next = new Set(prev);
      next.delete(viewId);
      return next;
    });

  const keepSyncingInBackground = (view: View) => {
    const { id: viewId, name } = view.simpleView;
    const { signal } = sessionAbortController.current;
    setIncompleteViewIds((prev) => new Set(prev).add(viewId));

    pollOperation(view.operationId!, {
      intervalMs: BACKGROUND_POLL_INTERVAL_MS,
      maxAttempts: BACKGROUND_MAX_POLL_ATTEMPTS,
      signal,
    })
      .then((result) => {
        if (result.timedOut || signal.aborted) return;
        removeIncomplete(viewId);
        queryClient.invalidateQueries({ queryKey: viewKeys.ownList() });
        if (result.status === 'COMPLETED') showInfo(`${name} is ready`);
        else showError(`${name} failed to sync`);
      })
      .catch(() => {});
  };

  const createView = (pendingView: View) => {
    setPendingViews((prev) => [...prev, pendingView]);

    const removePending = () =>
      setPendingViews((prev) => prev.filter((v) => v.operationId !== pendingView.operationId));
    const isGuild = pendingView.simpleView.extraArguments?.isGuild ?? false;
    const { signal } = sessionAbortController.current;
    const operation = isGuild
      ? pollOperation(pendingView.operationId!, {
          intervalMs: GUILD_POLL_INTERVAL_MS,
          maxAttempts: GUILD_MAX_POLL_ATTEMPTS,
          signal,
        })
      : pollOperation(pendingView.operationId!, { signal });

    operation
      .then((result) => {
        if (signal.aborted) return;
        queryClient.invalidateQueries({ queryKey: viewKeys.ownList() });
        if (result.status === 'COMPLETED') return;
        if (isGuild && result.timedOut) {
          keepSyncingInBackground(pendingView);
          return;
        }
        removePending();
        setCreateError('Failed to create ladder. Please try again.');
      })
      .catch(() => {
        removePending();
        queryClient.invalidateQueries({ queryKey: viewKeys.ownList() });
      });
  };

  const deleteView = async (viewId: string) => {
    const { signal } = sessionAbortController.current;
    setDeletingViewId(viewId);
    try {
      const { id: operationId } = await userRequest<{ id: string }>('DELETE', `/views/${viewId}`);
      await pollOperation(operationId, { signal });
    } catch {
      if (!signal.aborted) showError('Failed to delete ladder — please try again');
    } finally {
      setDeletingViewId(null);
      queryClient.invalidateQueries({ queryKey: viewKeys.ownList() });
    }
  };

  return {
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
