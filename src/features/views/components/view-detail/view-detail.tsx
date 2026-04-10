import { ArrowLeft, Edit, Trophy } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/app/hooks.ts";
import "./view-detail.css";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  RaiderioProfile,
  Season,
  ViewData,
} from "@/features/views/api/raiderio.ts";
import {
  loading,
  notLoading,
  selectLoading,
} from "@/app/loadingSlice.ts";
import {
  fetchWithoutResponse,
  fetchWithResponse,
} from "@/shared/api/EasyFetch.ts";
import { ViewRequest } from "@/features/views/api/view-types.ts";
import { CharacterLadder } from "./character-ladder.tsx";
import { DungeonGrid } from "./dungeon-grid.tsx";
import { EditView } from "./edit-view.tsx";

export function ViewDetail({ onBack }: Readonly<{ onBack: () => void }>) {
  const { viewId } = useParams();
  const navigate = useNavigate();
  const [viewName, setViewName] = useState<string>("");

  const [profiles, setProfiles] = useState<RaiderioProfile[]>([]);
  const [cachedProfiles, setCachedProfiles] = useState<RaiderioProfile[]>([]);
  const [season, setSeason] = useState<Season | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector(selectLoading);

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
            `/views/${viewId}/data`,
            undefined,
            `Bearer ${import.meta.env.VITE_SERVICE_TOKEN}`,
          ),
          fetchWithResponse<ViewData>(
            "GET",
            `/views/${viewId}/cached-data`,
            undefined,
            `Bearer ${import.meta.env.VITE_SERVICE_TOKEN}`,
          ),
        ]);
        setSeason(seasonData);
        setViewName(data.viewName);
        setProfiles(data.data);
        setCachedProfiles(cachedData.data);
      } catch (error) {
        console.error("Failed to fetch view data", error);
        navigate("/");
      } finally {
        dispatch(notLoading());
        setInitialized(true);
      }
    }

    fetchData();
  }, [viewId]);

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
        name: viewName,
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
          `/views/${viewId}`,
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

  if (!initialized) return null;

  return (
    <div className="view-detail-container">
      <div className="view-detail-content">
        <div className="view-detail-header">
          <button onClick={onBack} className="header-back-button">
            <ArrowLeft className="header-icon" />
          </button>
          <h1 className="header-view-title">{viewName}</h1>
          <button
            hidden={true}
            className={`header-edit-button ${isEditOpen ? "active" : ""}`}
            onClick={() => setIsEditOpen(!isEditOpen)}
          >
            <Edit className="header-icon" />
            <span className="header-button-text">Edit</span>
          </button>
        </div>

        {!isLoading && profiles.length === 0 ? (
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
              season={season}
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
