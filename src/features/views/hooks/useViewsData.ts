import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userRequestVoid } from "@/shared/api/httpClient.ts";
import { View } from "@/features/views/model/view.ts";
import { viewKeys, fetchViews, fetchOwnViews } from "@/features/views/api/viewQueries.ts";

export function useViewsData(isAuthenticated: boolean) {
  const queryClient = useQueryClient();

  const { data: featuredViews = [], isLoading: isLoadingFeatured } = useQuery({
    queryKey: viewKeys.list(),
    queryFn: fetchViews,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const { data: ownViews = [], isLoading: isLoadingOwn } = useQuery({
    queryKey: viewKeys.ownList(),
    queryFn: async () => {
      const serverData = await fetchOwnViews();
      const cached = queryClient.getQueryData<View[]>(viewKeys.ownList()) ?? [];

      const unconfirmed = cached.filter(
        (c) => !c.isSynced && !serverData.some((s) => s.simpleView.name === c.simpleView.name),
      );

      return [...serverData, ...unconfirmed];
    },
    enabled: isAuthenticated,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: (query) => {
      const data = (query.state.data as View[] | undefined) ?? [];
      return data.some((v) => !v.isSynced) ? 3000 : false;
    },
  });

  const deleteViewMutation = useMutation({
    mutationFn: (viewId: string) => userRequestVoid("DELETE", `/views/${viewId}`),

    onMutate: async (viewId) => {
      await queryClient.cancelQueries({ queryKey: viewKeys.ownList() });
      const previous = queryClient.getQueryData<View[]>(viewKeys.ownList());
      queryClient.setQueryData<View[]>(
        viewKeys.ownList(),
        (old) => old?.filter((v) => v.id !== viewId) ?? [],
      );
      return { previous };
    },

    onError: (_, __, context) => {
      if (context?.previous) {
        queryClient.setQueryData(viewKeys.ownList(), context.previous);
      }
      queryClient.invalidateQueries({ queryKey: viewKeys.ownList() });
    },
  });

  const createView = (pendingView: View) => {
    queryClient.setQueryData<View[]>(viewKeys.ownList(), (old) => [
      ...(old ?? []),
      pendingView,
    ]);
    queryClient.refetchQueries({ queryKey: viewKeys.ownList() });
  };

  return {
    featuredViews,
    isLoadingFeatured,
    ownViews,
    isLoadingOwn,
    createView,
    deleteView: deleteViewMutation.mutate,
  };
}
