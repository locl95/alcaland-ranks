import {ArrowLeft, ChevronDown, ChevronUp, Crown, ExternalLink, Trophy} from 'lucide-react';
import {useEffect, useState} from 'react';
import './view-detail.css';
import {SimpleView} from "@/app/utils/views/SimpleView";
import {MythicPlusRun, RaiderioProfile, Season, ViewData} from "@/app/utils/raiderio";
import {fetchWithResponse} from "@/app/utils/EasyFetch";
import {useAppDispatch} from "@/app/hooks";
import {loading, notLoading} from "@/app/features/loading/loadingSlice";

type ViewDetailProps = {
    view: SimpleView;
    onBack: () => void;
};

interface CharacterDungeonScore {
    character: RaiderioProfile;
    run: MythicPlusRun | undefined;
}

export function ViewDetail({view, onBack}: ViewDetailProps) {
    const [expandedCharacters, setExpandedCharacters] = useState<Set<number>>(new Set());
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

    const [isLadderOpen, setIsLadderOpen] = useState(true);

    // Sort characters by score (highest first)
    const sortedCharacters = [...raiderioProfiles].sort((a, b) => b.score - a.score);

    // Get best run for each character in a specific dungeon
    const getCharacterScoresForDungeon = (dungeonId: string): CharacterDungeonScore[] => {
        return raiderioProfiles.map(character => ({
            character,
            run: character.mythicPlusBestRuns.find(run => run.short_name === dungeonId)
        }));
    };

    // Find the highest score for a dungeon
    const getHighestScore = (scores: CharacterDungeonScore[]): number => {
        return Math.max(...scores.map(s => s.run?.score || 0));
    };

    const openRaiderIO = (character: RaiderioProfile) => {
        // Raider.IO URL format: https://raider.io/characters/region/realm/name
        // Assuming EU region for this example - you may want to add region to Character type
        const realm = 'Sanguino'.replace(/\s+/g, '-');
        const name = character.name.toLowerCase();
        const url = `https://raider.io/characters/eu/${realm}/${name}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const toggleCharacter = (characterId: number) => {
        setExpandedCharacters(prev => {
            const newSet = new Set(prev);
            if (newSet.has(characterId)) {
                newSet.delete(characterId);
            } else {
                newSet.add(characterId);
            }
            return newSet;
        });
    };

    const getClassSlug = (className: string): string => {
        return className.toLowerCase().replace(/\s+/g, '-');
    };

    return (
        <div className="view-detail-container">
            <div className="view-detail-content">
                <button onClick={onBack} className="back-button">
                    <ArrowLeft className="chevron-icon"/>
                    Back to Views
                </button>

                <div className="view-header">
                    <h1 className="view-title">{view.name}</h1>
                    <p className="view-stats">
                        {view.entitiesIds.length} character{view.entitiesIds.length !== 1 ? 's' : ''} tracked
                    </p>
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
                        {/* Character Ladder */}
                        <div className="ladder-card">
                            <div className="ladder-header" onClick={() => setIsLadderOpen(!isLadderOpen)}>
                                <div className="ladder-title">
                                    <Trophy className="trophy-icon"/>
                                    Character Ladder
                                </div>
                                <button className="ladder-toggle-btn">
                                    {isLadderOpen ? (
                                        <ChevronUp className="chevron-icon"/>
                                    ) : (
                                        <ChevronDown className="chevron-icon"/>
                                    )}
                                </button>
                            </div>
                            {isLadderOpen && (
                                <div className="ladder-content">
                                    {sortedCharacters.map((character, index) => {
                                        const isExpanded = expandedCharacters.has(character.id);

                                        return (
                                            <div key={character.id} className="ladder-row">
                                                <div
                                                    className="ladder-row-inner"
                                                    onClick={() => toggleCharacter(character.id)}
                                                >
                                                    <div className="ladder-rank">{index + 1}</div>
                                                    <div className="ladder-character-info">
                                                        <p className="ladder-character-name">{character.name}</p>
                                                        <div className="ladder-character-meta">
                                                            <span
                                                                className={`class-badge ${getClassSlug(character.class)}`}>
                                                                {character.class}
                                                            </span>
                                                            <span
                                                                className="ladder-character-spec">{character.spec}</span>
                                                            <span
                                                                className="ladder-character-realm">• {'Sanguino'}</span>
                                                        </div>
                                                    </div>
                                                    <div className="ladder-score">
                                                        <p className="ladder-score-value">
                                                            {character.score.toLocaleString()}
                                                        </p>
                                                        <p className="ladder-score-label">M+ Score</p>
                                                    </div>
                                                    <div className="ladder-actions">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openRaiderIO(character);
                                                            }}
                                                            className="raider-io-btn"
                                                        >
                                                            <ExternalLink className="external-icon"/>
                                                            Raider.IO
                                                        </button>
                                                        <button className="expand-btn">
                                                            {isExpanded ? (
                                                                <ChevronUp className="chevron-icon"/>
                                                            ) : (
                                                                <ChevronDown className="chevron-icon"/>
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>

                                                {isExpanded && character.mythicPlusRanks && (
                                                    <div className="ladder-row-expanded">
                                                        <div className="rankings-section">
                                                            <h4 className="rankings-section-title">Overall Rankings</h4>
                                                            <div className="rankings-grid">
                                                                <div className="ranking-item">
                                                                    <span className="ranking-label">World</span>
                                                                    <span
                                                                        className="ranking-value">#{character.mythicPlusRanks.overall.world.toLocaleString()}</span>
                                                                </div>
                                                                <div className="ranking-item">
                                                                    <span className="ranking-label">Region</span>
                                                                    <span
                                                                        className="ranking-value">#{character.mythicPlusRanks.overall.region.toLocaleString()}</span>
                                                                </div>
                                                                <div className="ranking-item">
                                                                    <span className="ranking-label">Realm</span>
                                                                    <span
                                                                        className="ranking-value">#{character.mythicPlusRanks.overall.realm.toLocaleString()}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {character.mythicPlusRanks.specs.length > 0 && (
                                                            <div className="rankings-section">
                                                                <h4 className="rankings-section-title">Spec
                                                                    Rankings</h4>
                                                                {character.mythicPlusRanks.specs
                                                                    .filter(spec => spec.score > 1000)
                                                                    .map((spec) => (
                                                                    <div key={spec.name} className="spec-ranking">
                                                                        <div className="spec-ranking-header">
                                                                            <span
                                                                                className="spec-ranking-name">{spec.name}</span>
                                                                            <span
                                                                                className="spec-ranking-score">({spec.score.toLocaleString()})</span>
                                                                        </div>
                                                                        <div className="rankings-grid">
                                                                            <div className="ranking-item">
                                                                                <span
                                                                                    className="ranking-label">World</span>
                                                                                <span
                                                                                    className="ranking-value">#{spec.world.toLocaleString()}</span>
                                                                            </div>
                                                                            <div className="ranking-item">
                                                                                <span
                                                                                    className="ranking-label">Region</span>
                                                                                <span
                                                                                    className="ranking-value">#{spec.region.toLocaleString()}</span>
                                                                            </div>
                                                                            <div className="ranking-item">
                                                                                <span
                                                                                    className="ranking-label">Realm</span>
                                                                                <span
                                                                                    className="ranking-value">#{spec.realm.toLocaleString()}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Dungeon Grid */}
                        <div className="dungeon-grid">
                            {season.dungeons.map(dungeon => {
                                const characterScores = getCharacterScoresForDungeon(dungeon.short_name);
                                const highestScore = getHighestScore(characterScores);

                                return (
                                    <div key={dungeon.challenge_mode_id} className="dungeon-card">
                                        <div className="dungeon-header">
                                            <div className="dungeon-title">{dungeon.name}</div>
                                            <div className="dungeon-abbreviation">{dungeon.short_name}</div>
                                        </div>
                                        <div className="dungeon-content">
                                            {characterScores.map(({character, run}) => {
                                                const isHighest = run && run.score === highestScore && highestScore > 0;

                                                return (
                                                    <div
                                                        key={character.id}
                                                        className={`character-run ${isHighest ? 'highest' : 'normal'}`}
                                                    >
                                                        <div className="character-run-left">
                                                            {isHighest && (
                                                                <Crown className="crown-icon"/>
                                                            )}
                                                            <div className="character-run-info">
                                                                <p className={`character-run-name ${isHighest ? 'highest' : 'normal'}`}>
                                                                    {character.name}
                                                                </p>
                                                                <p className="character-run-class">{character.class} - {character.spec}</p>
                                                            </div>
                                                        </div>

                                                        {run ? (
                                                            <div className="character-run-stats">
                                                                <p className={`character-run-score ${isHighest ? 'highest' : 'normal'}`}>
                                                                    {run.score}
                                                                </p>
                                                                <p className="character-run-level">+{run.mythic_level}</p>
                                                                <p className="character-run-date">
                                                                    {new Date().toLocaleDateString('en-US', {
                                                                        month: 'short',
                                                                        day: 'numeric'
                                                                    })}
                                                                </p>
                                                            </div>
                                                        ) : (
                                                            <div className="character-run-no-data">
                                                                <p>No run</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}