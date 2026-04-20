import { useEffect, useMemo, useState } from "react";
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

  const { data: serverViews = [], isLoading: isLoadingViews } = useQuery({
    queryKey: viewKeys.list(),
    queryFn: fetchViews,
  });

  const [pendingViews, setPendingViews] = useState<View[]>([]);
  const [pollForViews, setPollForViews] = useState(false);

  useQuery({
    queryKey: [...viewKeys.list(), "poll"],
    queryFn: fetchViews,
    enabled: pollForViews,
    refetchInterval: 5000,
    select: (data) => {
      queryClient.setQueryData(viewKeys.list(), data);
      return data;
    },
  });

  const views = useMemo(
    () => [
      ...serverViews,
      ...pendingViews.filter(
        (p) =>
          !serverViews.some((s) => s.simpleView.name === p.simpleView.name),
      ),
    ],
    [serverViews, pendingViews],
  );

  useEffect(() => {
    if (pendingViews.length === 0) return;
    const stillPending = pendingViews.filter(
      (p) => !serverViews.some((s) => s.simpleView.name === p.simpleView.name),
    );
    if (stillPending.length < pendingViews.length) {
      setPendingViews(stillPending);
    }
    if (stillPending.length === 0) {
      setPollForViews(false);
    }
  }, [serverViews, pendingViews]);

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

    onError: (_, __, context) => {
      if (context?.previous) {
        queryClient.setQueryData(viewKeys.list(), context.previous);
      }
      queryClient.invalidateQueries({ queryKey: viewKeys.list() });
    },
  });

  const handleCreateView = (pendingView: View) => {
    setPendingViews((prev) => [...prev, pendingView]);
    if (import.meta.env.VITE_FEATURE_FLAG_POLLING_ENABLED === "true") {
      setPollForViews(true);
    }
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
