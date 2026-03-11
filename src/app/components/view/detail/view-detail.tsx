import { ArrowLeft, Edit, Trophy } from "lucide-react";
import { SimpleView } from "@/app/utils/views/SimpleView";
import { RaiderioProfile, Season, ViewData } from "@/app/utils/raiderio";
import { fetchWithResponse } from "@/app/utils/EasyFetch";
import { EditViewWindow } from "@/app/components/view/detail/edit-view-window.tsx";
import { CharacterLadder } from "@/app/components/view/detail/character-ladder.tsx";
import { DungeonGrid } from "@/app/components/view/detail/dungeon-grid.tsx";
import { loading, notLoading } from "@/app/features/loading/loadingSlice.ts";
import { useAppDispatch } from "@/app/hooks.ts";
import "./view-detail.css";
import { useEffect, useState } from "react";

export function ViewDetail({
  view,
  onBack,
}: Readonly<{ view: SimpleView; onBack: () => void }>) {
  const [profiles, setProfiles] = useState<RaiderioProfile[]>([]);
  const [cachedProfiles, setCachedProfiles] = useState<RaiderioProfile[]>([]);
  const [season, setSeason] = useState<Season | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const dispatch = useAppDispatch();

  useEffect(() => {
    async function load() {
      dispatch(loading());
      try {
        const [seasonData, data, cachedData] = await Promise.all([
          fetchWithResponse<Season>(
            "GET",
            `/sources/wow/static`,
            undefined,
            `Bearer ${import.meta.env.VITE_SERVICE_TOKEN}`,
          ),
          fetchWithResponse<ViewData>(
            "GET",
            `/views/${view.id}/data`,
            undefined,
            `Bearer ${import.meta.env.VITE_SERVICE_TOKEN}`,
          ),
          fetchWithResponse<ViewData>(
            "GET",
            `/views/${view.id}/cached-data`,
            undefined,
            `Bearer ${import.meta.env.VITE_SERVICE_TOKEN}`,
          ),
        ]);
        setSeason(seasonData);
        setProfiles(data.data);
        setCachedProfiles(cachedData.data);
      } catch (error) {
        console.error("Failed to fetch view data", error);
      } finally {
        dispatch(notLoading());
      }
    }

    load();
  }, [view.id]);

  const handleSavedCharacters = (characters: RaiderioProfile[]) => {
    // const characterIds = characters.map(c => c.id);
    //
    // await fetchWithResponse(
    //     "PATCH",
    //     `/views/${view.id}`,
    //     { characterIds }
    // );

    setProfiles(characters);
    setIsEditOpen(false);
  };

  return (
    <div className="view-detail-container">
      <div className="view-detail-content">
        <div className="view-detail-header">
          <button onClick={onBack} className="header-back-button">
            <ArrowLeft className="header-icon" />
          </button>
          <h1 className="header-view-title">{view.name}</h1>
          <button
            className={`header-edit-button ${isEditOpen ? "active" : ""}`}
            onClick={() => setIsEditOpen(!isEditOpen)}
          >
            <Edit className="header-icon" />
            <span className="header-button-text">Edit</span>
          </button>
        </div>

        {profiles.length === 0 ? (
          <div className="empty-state">
            <Trophy className="empty-icon" />
            <h3 className="empty-title">No characters in this view</h3>
            <p className="empty-text">
              Add characters to start tracking their Mythic+ progress
            </p>
            <button
              className="empty-add-btn"
              onClick={() => setIsEditOpen(true)}
            >
              Add Your First Character
            </button>
          </div>
        ) : (
          <>
            <CharacterLadder
              characters={profiles}
              cachedCharacters={cachedProfiles}
            />

            {season && (
              <DungeonGrid
                raiderioProfiles={profiles}
                raiderioCachedProfiles={cachedProfiles}
                season={season}
              />
            )}
          </>
        )}
      </div>

      <EditViewWindow
        isOpen={isEditOpen}
        characters={profiles}
        onClose={() => setIsEditOpen(false)}
        onSave={handleSavedCharacters}
      />
    </div>
  );
}
