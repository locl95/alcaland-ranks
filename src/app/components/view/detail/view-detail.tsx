import {ArrowLeft, ExternalLink, Trophy} from 'lucide-react';
import {useEffect, useState} from 'react';
import './view-detail.css';
import {SimpleView} from "@/app/utils/views/SimpleView";
import {RaiderioProfile, Season, ViewData} from "@/app/utils/raiderio";
import {fetchWithResponse} from "@/app/utils/EasyFetch";
import {useAppDispatch} from "@/app/hooks";
import {loading, notLoading} from "@/app/features/loading/loadingSlice";
import {CharacterLadder} from "@/app/components/view/detail/character-ladder.tsx";
import {DungeonGrid} from "@/app/components/view/detail/dungeon-grid.tsx";

type ViewDetailProps = {
    view: SimpleView;
    onBack: () => void;
};

export function ViewDetail({view, onBack}: ViewDetailProps) {
    const [raiderioProfiles, setRaiderioProfiles] = useState<RaiderioProfile[]>([]);
    const [raiderioCachedProfiles, setRaiderioCachedProfiles] = useState<RaiderioProfile[]>([]);
    const [season, setSeason] = useState({
        is_main_season: true,
        name: "default season",
        blizzard_season_id: 1,
        dungeons: [],
    });
    const dispatch = useAppDispatch();

    useEffect(() => {
        async function getData() {
            dispatch(loading());
            try {
                const [seasonData, data, cachedData] = await Promise.all([
                    fetchWithResponse<Season>("GET", `/sources/wow/static`, undefined, `Bearer ${import.meta.env.VITE_SERVICE_TOKEN}`),
                    fetchWithResponse<ViewData>("GET", `/views/${view.id}/data`, undefined, `Bearer ${import.meta.env.VITE_SERVICE_TOKEN}`),
                    fetchWithResponse<ViewData>("GET", `/views/${view.id}/cached-data`, undefined, `Bearer ${import.meta.env.VITE_SERVICE_TOKEN}`)
                ]);
                setSeason(seasonData);
                setRaiderioProfiles(data.data);
                setRaiderioCachedProfiles(cachedData.data);
            } catch (error) {
                console.error("Failed to fetch view data", error);
            } finally {
                dispatch(notLoading());
            }
        }

        getData();
    }, [view.id]);


    return (
        <div className="view-detail-container">
            <div className="view-detail-content">
                <div className="view-detail-header">
                    <button onClick={onBack} className="header-back-button">
                        <ArrowLeft className="header-icon"/>
                    </button>
                    <h1 className="header-view-title">{view.name}</h1>
                    <button className="header-project-button">
                        <ExternalLink className="header-icon"/>
                    </button>
                </div>

                {view.entitiesIds.length === 0 ? (
                    <div className="empty-state">
                        <Trophy className="empty-icon"/>
                        <h3 className="empty-title">No characters in this view</h3>
                        <p className="empty-text">
                            Add characters to start tracking their Mythic+ progress
                        </p>
                    </div>
                ) : (
                    <>
                        <CharacterLadder
                            characters={raiderioProfiles}
                            cachedCharacters={raiderioCachedProfiles}
                        />

                        <DungeonGrid
                            raiderioProfiles={raiderioProfiles}
                            raiderioCachedProfiles={raiderioCachedProfiles}
                            season={season}
                        />
                    </>
                )}
            </div>
        </div>
    );
}