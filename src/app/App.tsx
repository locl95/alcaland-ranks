import { useEffect, useRef, useState } from "react";
import { ViewsList } from "@/app/components/views-list";
import { CreateView } from "@/app/components/create-view.tsx";
import { useAppDispatch } from "./hooks";
import { loading, notLoading } from "./features/loading/loadingSlice";
import { fetchWithResponse } from "./utils/EasyFetch";
import { GetViewsResponse } from "./utils/views/GetViewsResponse";
import { ViewDetail } from "@/app/components/view/detail/view-detail.tsx";
import { View } from "@/app/utils/views/View.tsx";

type Screen = { type: "views" } | { type: "view-detail"; viewId: string };

export default function App() {
  const [views, setViews] = useState<View[]>([]);
  const [currentScreen, setCurrentScreen] = useState<Screen>({ type: "views" });
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const dispatch = useAppDispatch();

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchAndSetViews();
  }, []);

  useEffect(() => {
    return () => {
      clearPolling();
    };
  }, []);

  useEffect(() => {
    if (currentScreen.type === "view-detail") {
      const viewExists = views.some((v) => v.id === currentScreen.viewId);
      if (!viewExists) {
        setCurrentScreen({ type: "views" });
      }
    }
  }, [currentScreen, views]);

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

  const clearPolling = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const startPolling = (
    attempts: number,
    initialDelay: number,
    retryDelay: number,
  ) => {
    clearPolling();

    timeoutRef.current = setTimeout(() => {
      pollViews(attempts, retryDelay);
    }, initialDelay);
  };

  const pollViews = async (attemptsLeft: number, delay: number) => {
    if (attemptsLeft === 0) return;

    try {
      const backendViews = await fetchBackendViews();

      setViews((prev) => {
        const updated = reconcileViews(prev, backendViews);

        const stillPending = updated.some((v) => !v.isSynced);

        if (stillPending) {
          timeoutRef.current = setTimeout(() => {
            pollViews(attemptsLeft - 1, delay);
          }, delay);
        }

        return updated;
      });
    } catch (error) {
      console.error("Polling failed", error);

      timeoutRef.current = setTimeout(() => {
        pollViews(attemptsLeft - 1, delay);
      }, delay);
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

    if (import.meta.env.FEATURE_FLAG_POLLING_ENABLED) {
      console.log("starting polling");
      startPolling(3, 3000, 5000);
    }
  };

  const handleViewClick = (viewId: string) => {
    setCurrentScreen({ type: "view-detail", viewId });
  };

  const handleBackToViews = async () => {
    setCurrentScreen({ type: "views" });

    console.log("clearing polling");
    clearPolling();

    await fetchAndSetViews();
  };

  if (currentScreen.type === "views") {
    return (
      <>
        <ViewsList
          views={views}
          onViewClick={handleViewClick}
          onCreateView={() => setIsCreateDialogOpen(true)}
        />
        <CreateView
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onCreateView={handleCreateView}
        />
      </>
    );
  }

  if (currentScreen.type === "view-detail") {
    const view = views.find((v) => v.id === currentScreen.viewId);
    if (!view) return null;

    return <ViewDetail view={view.simpleView} onBack={handleBackToViews} />;
  }

  return null;
}
