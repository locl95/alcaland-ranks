import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/shared/components/toaster/toast.ts';
import { userRequest } from '@/shared/api/httpClient.ts';
import { View } from '@/features/views/model/view.ts';
import {
  viewKeys,
  fetchViews,
  fetchOwnViews,
  pollOperation,
} from '@/features/views/api/viewQueries.ts';

export function useViewsData(isAuthenticated: boolean) {
  const queryClient = useQueryClient();
  const { showError } = useToast();
  const [pendingViews, setPendingViews] = useState<View[]>([]);
  const [deletingViewId, setDeletingViewId] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  const { data: featuredViews = [], isLoading: isLoadingFeatured } = useQuery({
    queryKey: viewKeys.list(),
    queryFn: fetchViews,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const { data: serverOwnViews = [], isLoading: isLoadingOwn } = useQuery({
    queryKey: viewKeys.ownList(),
    queryFn: fetchOwnViews,
    enabled: isAuthenticated,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

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
    ownViews,
    isLoadingOwn,
    createView,
    deleteView,
    deletingViewId,
    createError,
    clearCreateError: () => setCreateError(null),
  };
}
