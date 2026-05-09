import { Plus, User, Users, Loader2, Trash2 } from "lucide-react";
import "./views-list.css";
import { useAppSelector } from "@/app/hooks.ts";
import { selectUsername } from "@/app/authSlice.ts";
import { View } from "@/features/views/model/view.ts";

interface ViewsListProps {
  views: View[];
  isLoadingViews: boolean;
  deletingViewId: string | null;
  onViewClick: (viewId: string) => void;
  onCreateView: () => void;
  onDeleteView: (viewId: string) => void;
}

export function ViewsList({
  views,
  isLoadingViews,
  deletingViewId,
  onViewClick,
  onCreateView,
  onDeleteView,
}: Readonly<ViewsListProps>) {
  const username = useAppSelector(selectUsername);
  const pendingViews = views.some((v) => v.status === "pending");

  if (isLoadingViews && views.length === 0) return null;

  return views.length === 0 ? (
    <div className="views-empty-state">
      <div className="views-empty-content">
        <Users className="views-empty-icon" />
        <h3 className="views-empty-title">No views yet</h3>
        <p className="views-empty-text">
          Create your first ladder to start tracking characters
        </p>
        <button onClick={onCreateView} className="create-view-btn">
          <Plus className="view-row-icon" />
          Create your first ladder
        </button>
      </div>
    </div>
  ) : (
    <div className="views-list-container-box">
      {views.map((view, index) => {
        const isPending = view.status === "pending";
        const isDisabled = isPending;
        const isLast = index === views.length - 1;

        return (
          <div
            key={view.simpleView.id}
            className={[
              "view-row",
              !isLast && "with-border",
              isDisabled && "view-row-pending",
            ].filter(Boolean)
              .join(" ")}
            onClick={() => !isDisabled && onViewClick(view.simpleView.id)}
          >
            <div className="view-row-content">
              <h3 className="view-row-title">{view.simpleView.name}</h3>

              {isPending && (
                <p className="view-row-description">
                  Synchronizing with server...
                </p>
              )}

              {!isDisabled && (
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
              )}
            </div>

            <div
              className="view-row-actions"
              onClick={(e) => e.stopPropagation()}
            >
              {isDisabled && <Loader2 className="loading-icon" />}

              {!isDisabled && username === view.simpleView.owner && (
                <button
                  className="view-row-delete-btn"
                  title={pendingViews || !!deletingViewId ? "Cannot delete while syncing" : "Delete view"}
                  disabled={pendingViews || !!deletingViewId}
                  onClick={() => onDeleteView(view.simpleView.id)}
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
