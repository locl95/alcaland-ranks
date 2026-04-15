import { useEffect, useState } from "react";
import { Routes, Route, useNavigate, Navigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "./hooks";
import { loading, notLoading } from "@/app/loadingSlice.ts";
import { serviceGet, userRequestVoid } from "@/shared/api/httpClient.ts";
import { GetViewsResponse } from "@/features/views/api/view-types.ts";
import { ViewDetail } from "@/features/views/components/view-detail/view-detail.tsx";
import { View } from "@/features/views/model/view.ts";
import { usePolling } from "@/shared/hooks/usePolling.tsx";
import { Spinner } from "@/shared/components/spinner.tsx";
import { ViewsPage } from "@/features/views/components/views-page/views-page.tsx";
import { LoginPage } from "@/features/auth/LoginPage.tsx";
import { selectIsAuthenticated, selectUsername } from "@/app/authSlice.ts";
import { useLocation } from "react-router-dom";

export function App() {
  const [views, setViews] = useState<View[]>([]);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const username = useAppSelector(selectUsername);

  useEffect(() => {
    fetchAndSetViews();
  }, []);

  const fetchAndSetViews = async () => {
    dispatch(loading());
    try {
      const backendViews = await fetchBackendViews();
      setViews(backendViews);
    } catch (error) {
      console.error("Failed to fetch views", error);
    } finally {
      dispatch(notLoading());
    }
  };

  const fetchBackendViews = async (): Promise<View[]> => {
    const response = await serviceGet<GetViewsResponse>("/views?game=wow");

    return response.records.map((v) => ({
      id: v.id,
      simpleView: v,
      isSynced: true,
    }));
  };

  const { start: startPolling, stop: stopPolling } = usePolling<View[]>({
    fn: fetchBackendViews,
    shouldContinue: (backendViews) => {
      let stillPending = false;

      setViews((prev) => {
        const updated = reconcileViews(prev, backendViews);
        stillPending = updated.some((v) => !v.isSynced);
        return updated;
      });

      return stillPending;
    },
    maxAttempts: 3,
    delay: 5000,
    initialDelay: 3000,
  });

  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  const reconcileViews = (current: View[], backend: View[]): View[] => {
    const pending = current.filter((v) => !v.isSynced);
    const reconciled = [...backend];

    pending.forEach((temp) => {
      const exists = backend.some(
        (v) => v.simpleView.name === temp.simpleView.name,
      );
      if (!exists) {
        reconciled.push(temp);
      }
    });

    return reconciled;
  };

  const handleCreateView = (pendingView: View) => {
    setViews((prev) => [...prev, pendingView]);

    if (import.meta.env.VITE_FEATURE_FLAG_POLLING_ENABLED == "true") {
      startPolling();
    }
  };

  const handleViewClick = (viewId: string) => {
    const owner = views.find((v) => v.id === viewId)?.simpleView.owner;
    navigate(`/${viewId}`, { state: { owner } });
  };

  const handleBackToViews = () => {
    stopPolling();
    navigate("/");
    if (views.some((v) => !v.isSynced)) {
      startPolling();
    }
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

  const handleDeleteView = async (viewId: string) => {
    requireAuth(async () => {
      setViews((prev) => prev.filter((view) => view.id !== viewId));
      try {
        await userRequestVoid("DELETE", `/views/${viewId}`);
      } catch (error) {
        console.log("error [DeleteView] viewId:", viewId);
        fetchAndSetViews();
      }
    });
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
              isAuthenticated={isAuthenticated}
              username={username}
              onViewClick={handleViewClick}
              onDeleteView={handleDeleteView}
              onCreateView={handleCreateView}
              onLoginRequired={handleLoginRequired}
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
