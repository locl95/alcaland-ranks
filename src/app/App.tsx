import { useEffect, useState } from "react";
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

  useEffect(() => {
    const fetchViews = async () => {
      dispatch(loading());
      try {
        const response = await fetchWithResponse<GetViewsResponse>(
          "GET",
          "/views?game=wow&featured=true",
          undefined,
          `Bearer ${import.meta.env.VITE_SERVICE_TOKEN}`,
        );

        setViews(
          response.records.map((v) => ({
            id: v.id,
            simpleView: v,
            isSynced: true,
          })),
        );
      } catch (error) {
        console.error("Failed to fetch views", error);
      } finally {
        dispatch(notLoading());
      }
    };
    fetchViews();
  }, [dispatch]);

  const handleCreateView = (view: View) => {
    setViews((prev) => [...prev, view]);
  };

  const handleViewClick = (viewId: string) => {
    setCurrentScreen({ type: "view-detail", viewId });
  };

  const handleBackToViews = () => {
    setCurrentScreen({ type: "views" });
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
    if (!view) {
      setCurrentScreen({ type: "views" });
      return null;
    }

    return <ViewDetail view={view.simpleView} onBack={handleBackToViews} />;
  }
}
