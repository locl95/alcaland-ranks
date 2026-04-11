import { useState } from "react";
import { Plus } from "lucide-react";
import { View } from "@/features/views/model/view.ts";
import { ViewsList } from "./views-list.tsx";
import { CreateView } from "./actions/create-view.tsx";
import "./views-page.css";

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
              hidden={true}
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
