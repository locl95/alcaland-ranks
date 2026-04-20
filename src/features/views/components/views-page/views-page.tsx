import { useState } from "react";
import { Plus, User, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@radix-ui/react-dropdown-menu";
import { View } from "@/features/views/model/view.ts";
import { ViewsList } from "./views-list.tsx";
import { CreateView } from "./actions/create-view.tsx";
import "./views-page.css";

interface ViewsPageProps {
  views: View[];
  isLoadingViews: boolean;
  isAuthenticated: boolean;
  username: string | null;
  onViewClick: (viewId: string) => void;
  onCreateView: (pendingView: View) => void;
  onDeleteView: (viewId: string) => void;
  onLoginRequired: () => void;
  onLogout: () => void;
}

export function ViewsPage({
  views,
  isLoadingViews,
  isAuthenticated,
  username,
  onViewClick,
  onCreateView,
  onDeleteView,
  onLoginRequired,
  onLogout,
}: Readonly<ViewsPageProps>) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const isSyncing = views.some((v) => !v.isSynced);

  const handleCreateClick = () => {
    if (!isAuthenticated) {
      onLoginRequired();
      return;
    }
    setIsCreateDialogOpen(true);
  };

  return (
    <div className="views-list-container">
      <div className="views-list-content">
        <div className="views-header">
          <div className="views-header-text">
            <h1>Mythic+ ladder tracker</h1>
          </div>

          <div className="views-header-actions">
            {views.length > 0 && (
              <button
                onClick={handleCreateClick}
                className="create-view-btn"
                disabled={isSyncing}
                title={isSyncing ? "Wait for sync to complete" : undefined}
              >
                <Plus className="icon-lg" />
                Ladder
              </button>
            )}

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
                    onSelect={onLogout}
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

        <ViewsList
          views={views}
          isLoadingViews={isLoadingViews}
          username={username}
          onViewClick={onViewClick}
          onCreateView={handleCreateClick}
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
