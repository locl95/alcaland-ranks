import { useState } from "react";
import { Plus } from "lucide-react";
import { View } from "@/features/views/model/View.tsx";
import { ViewsList } from "@/features/views/components/views-list.tsx";
import { CreateView } from "@/features/views/components/create-view.tsx";
import "@/styles/app/App.css";

interface ViewsPageProps {
  views: View[];
  onViewClick: (viewId: string) => void;
  onCreateView: (pendingView: View) => void;
  onDeleteView: (viewId: string) => void;
}

export function ViewsPage({
  views,
  onViewClick,
  onCreateView,
  onDeleteView,
}: Readonly<ViewsPageProps>) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  return (
    <div className="views-list-container">
      <div className="views-list-content">
        <div className="views-header">
          <div className="views-header-text">
            <h1>Mythic+ ladder tracker</h1>
          </div>

          {views.length > 0 && (
            <button
              onClick={() => setIsCreateDialogOpen(true)}
              className="create-view-btn"
            >
              <Plus className="icon-lg" />
              Create View
            </button>
          )}
        </div>

        <div className="views-season">
          <span className="views-season-label">Current season</span>
          <span className="views-season-value">Midnight Season 1</span>
        </div>

        <ViewsList
          views={views}
          onViewClick={onViewClick}
          onCreateView={() => setIsCreateDialogOpen(true)}
          onDeleteView={onDeleteView}
        />
      </div>

      <CreateView
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCreateView={onCreateView}
      />
    </div>
  );
}
