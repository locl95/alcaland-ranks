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

    const sortedCharacters = [...raiderioProfiles].sort((a, b) => b.score - a.score);
    const sortedCachedCharacters = [...raiderioCachedProfiles].sort((a, b) => b.score - a.score);

    const getCharacterScoresForDungeon = (dungeonId: string): CharacterDungeonScore[] => {
        return raiderioProfiles.map(character => ({
            character,
            run: character.mythicPlusBestRuns.find(run => run.short_name === dungeonId)
        }));
    };

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

    const getCachedRaiderIoProfile = (raiderioCachedProfiles: RaiderioProfile[], character: RaiderioProfile): RaiderioProfile | undefined => {
        return raiderioCachedProfiles.find(cachedProfile => cachedProfile.id == character.id);
    }

    const getClassSlug = (className: string): string => {
        return className.toLowerCase().replace(/\s+/g, '-');
    };

    const getLadderPositionChange = (raiderIoProfile: RaiderioProfile, cachedRaiderIoProfile: RaiderioProfile | undefined): number | null => {
        if (cachedRaiderIoProfile == undefined) return null;

        const currentPosition = sortedCharacters.findIndex(c => c.id === raiderIoProfile.id) + 1;
        const previousPosition = sortedCachedCharacters.findIndex(c => c.id === raiderIoProfile.id) + 1;

        return previousPosition - currentPosition;
    };

    const getRankChange = (currentRank: number, previousRank: number): number => {
        return previousRank - currentRank;
    };

    const getScoreImprovement = (raiderioProfile: RaiderioProfile, currentRun: MythicPlusRun): number => {
        const cachedRun = getCachedRaiderIoProfile(
            raiderioCachedProfiles,
            raiderioProfile
        )?.mythicPlusBestRuns
            .find(run => run.short_name === currentRun.short_name);

        if (!cachedRun) {
            return 0;
        }

        return currentRun.score - cachedRun.score
    };

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
                                        const cachedRaiderIoProfile = getCachedRaiderIoProfile(raiderioCachedProfiles, character);
                                        const positionChange = getLadderPositionChange(character, cachedRaiderIoProfile);

                                        return (
                                            <div key={character.id} className="ladder-row">
                                                <div
                                                    className="ladder-row-inner"
                                                    onClick={() => toggleCharacter(character.id)}>
                                                    <div className="ladder-rank">{index + 1}</div>
                                                    <div className="ladder-character-info">
                                                        <div className="ladder-character-name-row">
                                                            <p className="ladder-character-name">{character.name}</p>
                                                            {positionChange !== null && positionChange !== 0 && (
                                                                <span
                                                                    className={`ladder-position-change ${positionChange > 0 ? 'improved' : 'declined'}`}>
                                                                    {positionChange > 0 ? `↑ ${positionChange}` : `↓ ${Math.abs(positionChange)}`}
                                                                </span>
                                                            )}
                                                        </div>
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
                                                                    <div className="ranking-value-row">
                                                                        <span
                                                                            className="ranking-value">#{character.mythicPlusRanks.overall.world.toLocaleString()}</span>
                                                                        {cachedRaiderIoProfile?.mythicPlusRanks.overall.world.toLocaleString() && (() => {
                                                                            const change = getRankChange(character.mythicPlusRanks.overall.world, cachedRaiderIoProfile?.mythicPlusRanks.overall.world);
                                                                            return change === 0 ? null : (
                                                                                <span
                                                                                    className={`rank-change ${change > 0 ? 'improved' : 'declined'}`}>{change > 0 ? `+${change}` : change}
                                                                                </span>);
                                                                        })()
                                                                        }
                                                                    </div>
                                                                </div>
                                                                <div className="ranking-item">
                                                                    <span className="ranking-label">Region</span>
                                                                    <div className="ranking-value-row">
                                                                        <span
                                                                            className="ranking-value">#{character.mythicPlusRanks.overall.region.toLocaleString()}</span>
                                                                        {cachedRaiderIoProfile?.mythicPlusRanks.overall.world.toLocaleString() && (() => {
                                                                            const change = getRankChange(character.mythicPlusRanks.overall.region, cachedRaiderIoProfile?.mythicPlusRanks.overall.region);
                                                                            return change === 0 ? null : (
                                                                                <span
                                                                                    className={`rank-change ${change > 0 ? 'improved' : 'declined'}`}>{change > 0 ? `+${change}` : change}
                                                                                </span>);
                                                                        })()
                                                                        }
                                                                    </div>
                                                                </div>
                                                                <div className="ranking-item">
                                                                    <span className="ranking-label">Realm</span>
                                                                    <div className="ranking-value-row">
                                                                        <span
                                                                            className="ranking-value">#{character.mythicPlusRanks.overall.realm.toLocaleString()}</span>
                                                                        {cachedRaiderIoProfile?.mythicPlusRanks.overall.realm.toLocaleString() && (() => {
                                                                            const change = getRankChange(character.mythicPlusRanks.overall.realm, cachedRaiderIoProfile?.mythicPlusRanks.overall.realm);
                                                                            return change === 0 ? null : (
                                                                                <span
                                                                                    className={`rank-change ${change > 0 ? 'improved' : 'declined'}`}>{change > 0 ? `+${change}` : change}
                                                                                </span>);
                                                                        })()
                                                                        }
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {character.mythicPlusRanks.specs.length > 0 && (
                                                            <div className="rankings-section">
                                                                <h4 className="rankings-section-title">Spec
                                                                    Rankings</h4>
                                                                {character.mythicPlusRanks.specs
                                                                    .filter(spec => spec.score > 1000)
                                                                    .map((spec) => {
                                                                        const previousSpec =
                                                                            cachedRaiderIoProfile?.mythicPlusRanks.specs.find(s => s.name === spec.name);

                                                                        return (
                                                                            <div key={spec.name}
                                                                                 className="spec-ranking">
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
                                                                                        <div
                                                                                            className="ranking-value-row">
                                                                                        <span
                                                                                            className="ranking-value">#{spec.world.toLocaleString()}</span>
                                                                                            {previousSpec && (() => {
                                                                                                const change = getRankChange(spec.world, previousSpec.world);
                                                                                                return change === 0 ? null : (
                                                                                                    <span
                                                                                                        className={`rank-change ${change > 0 ? 'improved' : 'declined'}`}>{change > 0 ? `+${change}` : change}</span>
                                                                                                );
                                                                                            })()}
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="ranking-item">
                                                                                    <span
                                                                                        className="ranking-label">Region</span>
                                                                                        <div
                                                                                            className="ranking-value-row">
                                                                                        <span
                                                                                            className="ranking-value">#{spec.region.toLocaleString()}</span>
                                                                                            {previousSpec && (() => {
                                                                                                const change = getRankChange(spec.region, previousSpec.region);
                                                                                                return change === 0 ? null : (
                                                                                                    <span
                                                                                                        className={`rank-change ${change > 0 ? 'improved' : 'declined'}`}>{change > 0 ? `+${change}` : change}</span>
                                                                                                );
                                                                                            })()}
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="ranking-item">
                                                                                    <span
                                                                                        className="ranking-label">Realm</span>
                                                                                        <div
                                                                                            className="ranking-value-row">
                                                                                        <span
                                                                                            className="ranking-value">#{spec.realm.toLocaleString()}</span>
                                                                                            {previousSpec && (() => {
                                                                                                const change = getRankChange(spec.realm, previousSpec.realm);
                                                                                                return change === 0 ? null : (
                                                                                                    <span
                                                                                                        className={`rank-change ${change > 0 ? 'improved' : 'declined'}`}>{change > 0 ? `+${change}` : change}</span>
                                                                                                );
                                                                                            })()}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
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
                                                const isHighest = run?.score === highestScore && highestScore > 0;
                                                const scoreImprovement = run ? getScoreImprovement(character, run) : 0;

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
                                                                <div className="character-run-score-row">
                                                                    <p className={`character-run-score ${isHighest ? 'highest' : 'normal'}`}>
                                                                        {run.score}
                                                                    </p>
                                                                    {scoreImprovement > 0 && (
                                                                        <span
                                                                            className="score-improvement">+{scoreImprovement}</span>
                                                                    )}
                                                                </div>
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