import { Routes, Route, useNavigate, Navigate, useLocation } from "react-router-dom";
import { useAppSelector } from "./hooks";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userRequestVoid } from "@/shared/api/httpClient.ts";
import { ViewDetail } from "@/features/views/components/view-detail/view-detail.tsx";
import { View } from "@/features/views/model/view.ts";
import { Spinner } from "@/shared/components/spinner.tsx";
import { ViewsPage } from "@/features/views/components/views-page/views-page.tsx";
import { LoginPage } from "@/features/auth/LoginPage.tsx";
import { selectIsAuthenticated, selectUsername } from "@/app/authSlice.ts";
import { logout } from "@/features/auth/authApi.ts";
import { viewKeys, fetchViews } from "@/features/views/api/viewQueries.ts";

export function App() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const username = useAppSelector(selectUsername);

  const { data: views = [], isLoading: isLoadingViews } = useQuery({
    queryKey: viewKeys.list(),
    queryFn: async () => {
      const serverData = await fetchViews();
      const cached = queryClient.getQueryData<View[]>(viewKeys.list()) ?? [];

      // Names of views still pending on the frontend
      const pendingNames = new Set(
        cached.filter((c) => !c.isSynced).map((c) => c.simpleView.name),
      );

      // Keep a server view as pending if it was pending on frontend and has no entities yet
      const merged = serverData.map((v) =>
        pendingNames.has(v.simpleView.name) && v.simpleView.entitiesIds.length === 0
          ? { ...v, isSynced: false }
          : v,
      );

      // Include pending views the server hasn't returned at all yet
      const unconfirmed = cached.filter(
        (c) => !c.isSynced && !serverData.some((s) => s.simpleView.name === c.simpleView.name),
      );

      return [...merged, ...unconfirmed];
    },
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: (query) => {
      const data = (query.state.data as View[] | undefined) ?? [];
      return data.some((v) => !v.isSynced) ? 3000 : false;
    },
  });

  const deleteViewMutation = useMutation({
    mutationFn: (viewId: string) =>
      userRequestVoid("DELETE", `/views/${viewId}`),

    onMutate: async (viewId) => {
      await queryClient.cancelQueries({ queryKey: viewKeys.list() });
      const previous = queryClient.getQueryData<View[]>(viewKeys.list());
      queryClient.setQueryData<View[]>(
        viewKeys.list(),
        (old) => old?.filter((v) => v.id !== viewId) ?? [],
      );
      return { previous };
    },

    onSuccess: (_, viewId) => {
      queryClient.setQueryData<View[]>(
        viewKeys.list(),
        (old) => old?.filter((v) => v.id !== viewId) ?? [],
      );
    },

    onError: (_, __, context) => {
      if (context?.previous) {
        queryClient.setQueryData(viewKeys.list(), context.previous);
      }
    },
  });

  const handleCreateView = (pendingView: View) => {
    queryClient.setQueryData<View[]>(viewKeys.list(), (old) => [
      ...(old ?? []),
      pendingView,
    ]);
    // Kick off a fetch immediately; the queryFn will preserve the pending view
    // until the server confirms it, and refetchInterval keeps polling after.
    queryClient.refetchQueries({ queryKey: viewKeys.list() });
  };

  const handleViewClick = (viewId: string) => {
    const view = views.find((v) => v.id === viewId);
    const owner = view?.simpleView.owner;
    const entitiesCount = view?.simpleView.entitiesIds.length ?? 0;
    navigate(`/${viewId}`, { state: { owner, entitiesCount } });
  };

  const handleBackToViews = () => {
    navigate("/");
  };

  const requireAuth = (action: () => void) => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: location.pathname } });
      return;
    }
    action();
  };

  const handleLoginRequired = () => {
    navigate("/login", { state: { from: location.pathname } });
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const handleDeleteView = (viewId: string) => {
    requireAuth(() => deleteViewMutation.mutate(viewId));
  };

  return (
    <>
      <Spinner />
      <Routes>
        <Route
          path="/"
          element={
            <ViewsPage
              views={views}
              isLoadingViews={isLoadingViews}
              isAuthenticated={isAuthenticated}
              username={username}
              onViewClick={handleViewClick}
              onDeleteView={handleDeleteView}
              onCreateView={handleCreateView}
              onLoginRequired={handleLoginRequired}
              onLogout={handleLogout}
            />
          }
        />

        <Route
          path="/:viewId"
          element={<ViewDetail onBack={handleBackToViews} />}
        />

        <Route path="/login" element={<LoginPage />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
