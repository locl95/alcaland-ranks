import { Routes, Route, useNavigate, Navigate, useLocation } from "react-router-dom";
import { useAppSelector } from "./hooks";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { userRequestVoid } from "@/shared/api/httpClient.ts";
import { ViewDetail } from "@/features/views/components/view-detail/view-detail.tsx";
import { View } from "@/features/views/model/view.ts";
import { Spinner } from "@/shared/components/spinner.tsx";
import "./App.css";
import { Footer } from "@/shared/components/footer.tsx";
import { ViewsPage } from "@/features/views/components/views-page/views-page.tsx";
import { LoginPage } from "@/features/auth/LoginPage.tsx";
import { selectIsAuthenticated, selectUsername } from "@/app/authSlice.ts";
import { logout } from "@/features/auth/authApi.ts";
import { viewKeys, fetchViews, fetchOwnViews } from "@/features/views/api/viewQueries.ts";

export function App() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const username = useAppSelector(selectUsername);

  const [activeTab, setActiveTab] = useState<"featured" | "own">(
    isAuthenticated ? "own" : "featured",
  );

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

  const views = activeTab === "featured" ? featuredViews : ownViews;
  const isLoadingViews = activeTab === "featured" ? isLoadingFeatured : isLoadingOwn;

  const deleteViewMutation = useMutation({
    mutationFn: (viewId: string) =>
      userRequestVoid("DELETE", `/views/${viewId}`),

    onMutate: async (viewId) => {
      await queryClient.cancelQueries({ queryKey: viewKeys.ownList() });
      const previous = queryClient.getQueryData<View[]>(viewKeys.ownList());
      queryClient.setQueryData<View[]>(
        viewKeys.ownList(),
        (old) => old?.filter((v) => v.id !== viewId) ?? [],
      );
      return { previous };
    },

    onSuccess: (_, viewId) => {
      queryClient.setQueryData<View[]>(
        viewKeys.ownList(),
        (old) => old?.filter((v) => v.id !== viewId) ?? [],
      );
    },

    onError: (_, __, context) => {
      if (context?.previous) {
        queryClient.setQueryData(viewKeys.ownList(), context.previous);
      }
      queryClient.invalidateQueries({ queryKey: viewKeys.ownList() });
    },
  });

  const handleCreateView = (pendingView: View) => {
    queryClient.setQueryData<View[]>(viewKeys.ownList(), (old) => [
      ...(old ?? []),
      pendingView,
    ]);
    queryClient.refetchQueries({ queryKey: viewKeys.ownList() });
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
    <div className="app-layout">
      <Spinner />
      <main className="app-main">
        <Routes>
          <Route
            path="/"
            element={
              <ViewsPage
                views={views}
                isLoadingViews={isLoadingViews}
                isAuthenticated={isAuthenticated}
                username={username}
                activeTab={activeTab}
                onTabChange={setActiveTab}
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
    </main>
      <Footer />
    </div>
  );
}

export default App;
