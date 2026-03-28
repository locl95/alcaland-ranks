import { useEffect, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { useAppDispatch } from "./hooks";
import { loading, notLoading } from "@/features/loading/loadingSlice.ts";
import {
  fetchWithoutResponse,
  fetchWithResponse,
} from "@/shared/api/EasyFetch.ts";
import { GetViewsResponse } from "@/features/views/api/GetViewsResponse.tsx";
import { ViewDetail } from "@/features/views/components/view-detail.tsx";
import { View } from "@/features/views/model/View.tsx";
import { usePolling } from "@/shared/hooks/usePolling.tsx";
import { Spinner } from "@/shared/components/spinner.tsx";
import {ViewsPage} from "@/features/views/components/views-page.tsx";

export function App() {
  const [views, setViews] = useState<View[]>([]);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

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
    const response = await fetchWithResponse<GetViewsResponse>(
      "GET",
      "/views?game=wow",
      undefined,
      `Bearer ${import.meta.env.VITE_SERVICE_TOKEN}`,
    );

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
    navigate(`/${viewId}`);
  };

  const handleBackToViews = () => {
    stopPolling();
    navigate("/");
    if (views.some((v) => !v.isSynced)) {
      startPolling();
    }
  };

  const handleDeleteView = async (viewId: string) => {
    setViews((prev) => prev.filter((view) => view.id !== viewId));

    try {
      await fetchWithoutResponse(
        "DELETE",
        `/views/${viewId}`,
        undefined,
        `Bearer ${import.meta.env.VITE_SERVICE_TOKEN}`,
      );
    } catch (error) {
      console.log("error [DeleteView] viewId:", viewId);
      fetchAndSetViews();
    }
  };

  return (
    <>
      <Spinner />
      <Routes>
        <Route
          path="/"
          element={
            <ViewsPage views={views} onViewClick={handleViewClick} onDeleteView={handleDeleteView} onCreateView={handleCreateView} />
          }
        />

        <Route
          path="/:viewId"
          element={<ViewDetail onBack={handleBackToViews} />}
        />
      </Routes>
    </>
  );
}

export default App;