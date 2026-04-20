import { Plus, User, Users, Loader2, Trash2 } from "lucide-react";
import "./views-list.css";
import { View } from "@/features/views/model/view.ts";

interface ViewsListProps {
  views: View[];
  isLoadingViews: boolean;
  username: string | null;
  onViewClick: (viewId: string) => void;
  onCreateView: () => void;
  onDeleteView: (viewId: string) => void;
}

export function ViewsList({
  views,
  isLoadingViews,
  username,
  onViewClick,
  onCreateView,
  onDeleteView,
}: Readonly<ViewsListProps>) {
  const viewsSyncing = views.some((v) => !v.isSynced);

  if (isLoadingViews && views.length === 0) return null;

  return views.length === 0 ? (
    <div className="views-empty-state">
      <div className="views-empty-content">
        <Users className="views-empty-icon" />
        <h3 className="views-empty-title">No views yet</h3>
        <p className="views-empty-text">
          Create your first view to start tracking characters
        </p>
        <button onClick={onCreateView} className="create-view-btn">
          <Plus className="view-row-icon" />
          Create Your First View
        </button>
      </div>
    </div>
  ) : (
    <div className="views-list-container-box">
      {views.map((view, index) => {
        const isPending = !view.isSynced;

        return (
          <div
            key={view.id}
            className={`
        view-row
        ${index !== views.length - 1 ? "with-border" : ""}
        ${isPending ? "view-row-pending" : ""}
      `}
            onClick={() => !isPending && onViewClick(view.id)}
          >
            <div className="view-row-content">
              <h3 className="view-row-title">{view.simpleView.name}</h3>

              {isPending && (
                <p className="view-row-description">
                  "Synchronizing with server..."
                </p>
              )}

              <div className="view-row-meta">
                <div className="view-row-meta-item">
                  <Users className="view-row-icon" />
                  <span>
                    {view.simpleView.entitiesIds.length} character
                    {view.simpleView.entitiesIds.length === 1 ? "" : "s"}
                  </span>
                </div>

                <div className="view-row-meta-item">
                  <User className="view-row-icon" />
                  <span>{view.simpleView.owner}</span>
                </div>
              </div>
            </div>

            <div
              className="view-row-actions"
              onClick={(e) => e.stopPropagation()}
            >
              {isPending && <Loader2 className="loading-icon" />}

              {!isPending && username === view.simpleView.owner && (
                <button
                  className="view-row-delete-btn"
                  title={viewsSyncing ? "Cannot delete while syncing" : "Delete view"}
                  disabled={viewsSyncing}
                  onClick={() => onDeleteView(view.id)}
                >
                  <Trash2 className="view-row-menu-icon" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
