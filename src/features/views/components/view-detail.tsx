import { ArrowLeft, Edit, Trophy } from "lucide-react";
import { SimpleView } from "@/app/utils/views/SimpleView";
import { RaiderioProfile, Season, ViewData } from "@/app/utils/raiderio";
import { fetchWithoutResponse, fetchWithResponse } from "@/app/utils/EasyFetch";
import { EditView } from "@/app/components/view/detail/edit-view.tsx";
import { CharacterLadder } from "@/app/components/view/detail/character-ladder.tsx";
import { DungeonGrid } from "@/app/components/view/detail/dungeon-grid.tsx";
import { loading, notLoading } from "@/app/features/loading/loadingSlice.ts";
import { useAppDispatch } from "@/app/hooks.ts";
import "./view-detail.css";
import { useEffect, useState } from "react";
import { ViewRequest } from "@/app/utils/views/ViewRequest.tsx";

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
    async function fetchData() {
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
        setSeason(seasonData); //season data prob should be fetched from app.tsx
        setProfiles(data.data);
        setCachedProfiles(cachedData.data);
      } catch (error) {
        console.error("Failed to fetch view data", error);
      } finally {
        dispatch(notLoading());
      }
    }

    fetchData();
  }, [view.id]);

  function haveSameCharacters(
    a: RaiderioProfile[],
    b: RaiderioProfile[],
  ): boolean {
    if (a.length !== b.length) return false;

    const idsA = new Set(a.map((c) => c.id));

    for (const character of b) {
      if (!idsA.has(character.id)) {
        return false;
      }
    }

    return true;
  }

  const handleSavedCharacters = async (characters: RaiderioProfile[]) => {
    if (!haveSameCharacters(characters, profiles)) {
      const request: ViewRequest = {
        name: view.name,
        entities: characters.map((c) => ({
          name: c.name,
          region: c.region,
          realm: c.realm,
          type: "com.kos.entities.domain.WowEntityRequest",
        })),
        published: true,
        featured: false,
        game: "WOW",
      };

      try {
        console.log("[EditView] request:", request);

        await fetchWithoutResponse(
          "PUT",
          `/views/${view.id}`,
          request,
          `Bearer ${import.meta.env.VITE_SERVICE_TOKEN}`,
        );

        setProfiles(characters);
      } catch (error) {
        console.error("Failed to create view", error);
        setIsEditOpen(false);
      }
    }

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

      <EditView
        isOpen={isEditOpen}
        characters={profiles}
        onClose={() => setIsEditOpen(false)}
        onSave={handleSavedCharacters}
      />
    </div>
  );
}
