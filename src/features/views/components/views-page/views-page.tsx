import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { viewKeys } from "@/features/views/api/viewQueries.ts";
import { Plus, User, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@radix-ui/react-dropdown-menu";
import { useAppSelector } from "@/app/hooks.ts";
import { selectIsAuthenticated, selectUsername } from "@/app/authSlice.ts";
import { logout } from "@/features/auth/authApi.ts";
import { useViewsData } from "@/features/views/hooks/useViewsData.ts";
import { View } from "@/features/views/model/view.ts";
import { ViewsList } from "./views-list.tsx";
import { CreateView } from "./actions/create-view.tsx";
import "./views-page.css";

export function ViewsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const username = useAppSelector(selectUsername);

  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"featured" | "own">(
    isAuthenticated ? "own" : "featured",
  );

  useEffect(() => {
    if (!isAuthenticated) {
      setActiveTab("featured");
    }
  }, [isAuthenticated]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { featuredViews, isLoadingFeatured, ownViews, isLoadingOwn, createView, deleteView } =
    useViewsData(isAuthenticated);

  const views = activeTab === "featured" ? featuredViews : ownViews;
  const isLoadingViews = activeTab === "featured" ? isLoadingFeatured : isLoadingOwn;
  const isSyncing = views.some((v) => !v.isSynced);

  const requireAuth = (action: () => void) => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: location.pathname } });
      return;
    }
    action();
  };

  const handleViewClick = (viewId: string) => {
    const view = views.find((v) => v.id === viewId);
    navigate(`/${viewId}`, {
      state: {
        owner: view?.simpleView.owner,
        entitiesCount: view?.simpleView.entitiesIds.length ?? 0,
      },
    });
  };

  const handleCreateClick = () => requireAuth(() => setIsCreateDialogOpen(true));

  const handleOwnTabClick = () => requireAuth(() => setActiveTab("own"));

  const handleCreateView = (pendingView: View) => createView(pendingView);

  const handleDeleteView = (viewId: string) => requireAuth(() => deleteView(viewId));

  const handleLogout = async () => {
    await logout();
    queryClient.removeQueries({ queryKey: viewKeys.ownList() });
    navigate("/");
  };

  return (
    <div className="views-list-container">
      <div className="views-list-content">
        <div className="views-header">
          <div className="views-header-text">
            <h1>Mythic+ ladder tracker</h1>
          </div>

          <div className="views-header-actions">
            <button
              onClick={handleCreateClick}
              className="create-view-btn"
              disabled={isSyncing}
              title={isSyncing ? "Wait for sync to complete" : undefined}
            >
              <Plus className="icon-lg" />
              <span className="create-view-btn-label">Ladder</span>
            </button>

            {isAuthenticated && username && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="user-menu-btn">
                    <User className="user-menu-icon" />
                    <span className="user-menu-name">{username}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="user-menu-content" align="end">
                  <DropdownMenuItem
                    className="user-menu-item user-menu-item--danger"
                    onSelect={handleLogout}
                  >
                    <LogOut className="user-menu-item-icon" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        <div className="views-season">
          <span className="views-season-label">Current season</span>
          <span className="views-season-value">Midnight Season 1</span>
        </div>

        <div className="views-tab-toggle-wrapper">
          <div className="views-tab-toggle">
            <button
              className={`views-tab-btn${activeTab === "featured" ? " views-tab-btn--active" : ""}`}
              onClick={() => setActiveTab("featured")}
            >
              Featured
            </button>
            <button
              className={`views-tab-btn${activeTab === "own" ? " views-tab-btn--active" : ""}`}
              onClick={handleOwnTabClick}
            >
              Own
            </button>
          </div>
        </div>

        <ViewsList
          views={views}
          isLoadingViews={isLoadingViews}
          onViewClick={handleViewClick}
          onCreateView={handleCreateClick}
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
