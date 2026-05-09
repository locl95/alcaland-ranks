import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { userRequest } from "@/shared/api/httpClient.ts";
import { View } from "@/features/views/model/view.ts";
import { viewKeys, fetchViews, fetchOwnViews, pollOperation } from "@/features/views/api/viewQueries.ts";

export function useViewsData(isAuthenticated: boolean) {
  const queryClient = useQueryClient();
  const [pendingViews, setPendingViews] = useState<View[]>([]);
  const [deletingViewId, setDeletingViewId] = useState<string | null>(null);

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
    refetchInterval: pendingViews.length > 0 ? 3000 : false,
  });

  const ownViews = useMemo(() => {
    const serverNames = new Set(serverOwnViews.map((v) => v.simpleView.name));
    const stillPending = pendingViews.filter((v) => !serverNames.has(v.simpleView.name));
    return [...serverOwnViews, ...stillPending];
  }, [serverOwnViews, pendingViews]);

  const createView = (pendingView: View) => {
    setPendingViews((prev) => [...prev, pendingView]);

    pollOperation(pendingView.id)
      .then((result) => {
        setPendingViews((prev) => prev.filter((v) => v.id !== pendingView.id));
        if (result.status === "COMPLETED") {
          queryClient.invalidateQueries({ queryKey: viewKeys.ownList() });
        }
      })
      .catch(() => {
        setPendingViews((prev) => prev.filter((v) => v.id !== pendingView.id));
      });
  };

  const deleteView = async (viewId: string) => {
    setDeletingViewId(viewId);
    try {
      const { id: operationId } = await userRequest<{ id: string }>("DELETE", `/views/${viewId}`);
      await pollOperation(operationId);
    } catch {
      // network error - fall through to refresh
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
  };
}
