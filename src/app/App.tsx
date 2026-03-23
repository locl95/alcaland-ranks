import { useEffect, useState } from "react";
import { ViewsList } from "@/app/components/views-list";
import { CreateView } from "@/app/components/create-view.tsx";
import { useAppDispatch } from "./hooks";
import { loading, notLoading } from "./features/loading/loadingSlice";
import {fetchWithoutResponse, fetchWithResponse} from "./utils/EasyFetch";
import { GetViewsResponse } from "./utils/views/GetViewsResponse";
import { ViewDetail } from "@/app/components/view/detail/view-detail.tsx";
import { View } from "@/app/utils/views/View.tsx";
import {Plus} from "lucide-react";
import "./App.css";
import { usePolling} from "@/app/utils/usePolling.tsx";

type Screen = { type: "views" } | { type: "view-detail"; viewId: string };

export default function App() {
  const [views, setViews] = useState<View[]>([]);
  const [currentScreen, setCurrentScreen] = useState<Screen>({ type: "views" });
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const dispatch = useAppDispatch();

  useEffect(() => {
    fetchAndSetViews();
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

  const fetchBackendViews = async (): Promise<View[]> => {
    const response = await fetchWithResponse<GetViewsResponse>(
      "GET",
      "/views?game=wow",
      undefined,
      `Bearer ${import.meta.env.VITE_SERVICE_TOKEN}`
    );

    return response.records.map((v) => ({
      id: v.id,
      simpleView: v,
      isSynced: true,
    }));
  };

  const {
    start: startPolling,
    stop: stopPolling,
  } = usePolling<View[]>({
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
      console.log("starting polling");
      startPolling();
    }
  };

  const handleViewClick = (viewId: string) => {
    setCurrentScreen({ type: "view-detail", viewId });
  };

  const handleBackToViews = async () => {
    setCurrentScreen({ type: "views" });

    console.log("clearing polling");
    stopPolling();

    await fetchAndSetViews();
  };

  const handleDeleteView = async (viewId: string) => {
    setViews((prev) => prev.filter((view) => view.id !== viewId));

    try {
      await fetchWithoutResponse(
          "DELETE",
          `/views/${viewId}`,
          undefined,
          `Bearer ${import.meta.env.VITE_SERVICE_TOKEN}`
      );

    } catch (error) {
      console.log("error [DeleteView] viewId:", viewId);

      fetchAndSetViews();
    }
  }

  if (currentScreen.type === "views") {
    return (
        <div className="views-list-container">
          <div className="views-list-content">
            <div className="views-header">
              <div className="views-header-text">
                <h1>Mythic+ ladder tracker</h1>
              </div>

              {views.length > 0 &&
                  (<button onClick={() => setIsCreateDialogOpen(true)} className="create-view-btn">
                    <Plus className="icon-lg"/>
                    Create View
                  </button>)}
            </div>

            <div className="views-season">
              <span className="views-season-label">Current season</span>
              <span className="views-season-value">Midnight Season 1</span>
            </div>

            <ViewsList
                views={views}
                onViewClick={handleViewClick}
                onCreateView={() => setIsCreateDialogOpen(true)}
                onDeleteView={handleDeleteView}
            />
          </div>

          <CreateView
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
              onCreateView={handleCreateView}
          />
        </div>
    );
  }

  if (currentScreen.type === "view-detail") {
    const view = views.find((v) => v.id === currentScreen.viewId);
    if (!view) return null;

    return <ViewDetail view={view.simpleView} onBack={handleBackToViews} />;
  }

  return null;
}
