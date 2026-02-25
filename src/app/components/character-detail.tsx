import {ArrowLeft, Award, Calendar, Clock} from 'lucide-react';
import './character-detail.css';
import {RaiderioProfile} from "@/app/utils/raiderio";

interface CharacterDetailProps {
    character: RaiderioProfile;
    onBack: () => void;
}

export function CharacterDetail({character, onBack}: CharacterDetailProps) {
    const getDungeonById = (dungeonId: string) => {
        return character.mythicPlusBestRuns.find(dungeon => dungeon.short_name === dungeonId);
    };

    const getLevelColor = (level: number) => {
        if (level >= 23) return 'level-high';
        if (level >= 21) return 'level-medium';
        if (level >= 19) return 'level-low';
        return 'level-default';
    };

    const getClassSlug = (className: string): string => {
        return className.toLowerCase().replaceAll(/\s+/g, '-');
    };

    return (
        <div className="character-detail-container">
            <div className="character-detail-content">
                <button onClick={onBack} className="back-button">
                    <ArrowLeft className="arrow-icon"/>
                    Back to Characters
                </button>

                {/* Character Header */}
                <div className="character-header-card">
                    <div className="character-header-top">
                        <div>
                            <h1 className="character-name">{character.name}</h1>
                            <p className="character-realm">{'Sanguino'}</p>
                        </div>
                        <div className="character-badges">
              <span className={`class-badge ${getClassSlug(character.class)}`}>
                {character.class}
              </span>
                            <span className="spec-badge">
                {character.spec}
              </span>
                        </div>
                    </div>
                    <div className="character-rating">
                        <Award className="rating-icon"/>
                        <span className="rating-label">Mythic+ Rating:</span>
                        <span className="rating-value">
              {character.score.toLocaleString()}
            </span>
                    </div>
                    {character.mythicPlusRanks && (
                        <div className="character-rankings">
                            <div className="character-ranking-column">
                                <span className="character-ranking-label">World</span>
                                <span
                                    className="character-ranking-value">#{character.mythicPlusRanks.overall.world.toLocaleString()}</span>
                            </div>
                            <div className="character-ranking-column">
                                <span className="character-ranking-label">Region</span>
                                <span
                                    className="character-ranking-value">#{character.mythicPlusRanks.overall.region.toLocaleString()}</span>
                            </div>
                            <div className="character-ranking-column">
                                <span className="character-ranking-label">Realm</span>
                                <span
                                    className="character-ranking-value">#{character.mythicPlusRanks.overall.realm.toLocaleString()}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Best Runs */}
                <div className="section-header">
                    <h2 className="section-title">Best Dungeon Runs</h2>
                    <p className="section-description">Showing the highest key level completed for each dungeon</p>
                </div>

                <div className="runs-grid">
                    {character.mythicPlusBestRuns.map((run) => {
                        const dungeon = getDungeonById(run.short_name);
                        if (!dungeon) return null;

                        return (
                            <div key={run.dungeon} className="run-card">
                                <div className="run-card-header">
                                    <div>
                                        <h3 className="run-dungeon-name">{dungeon.dungeon}</h3>
                                        <p className="run-dungeon-abbr">{dungeon.short_name}</p>
                                    </div>
                                    <div>
                                        <p className={`run-level ${getLevelColor(run.mythic_level)}`}>
                                            +{run.mythic_level}
                                        </p>
                                    </div>
                                </div>
                                <div className="run-stats">
                                    <div className="run-stat-row">
                                        <div className="run-stat-label">
                                            <Award className="run-stat-icon"/>
                                            <span>Score</span>
                                        </div>
                                        <span className="run-stat-value score">{run.score.toFixed(1)}</span>
                                    </div>

                                    <div className="run-stat-row">
                                        <div className="run-stat-label">
                                            <Clock className="run-stat-icon"/>
                                            <span>Completion Time</span>
                                        </div>
                                        <span className="run-stat-value time">{'30:34'}</span>
                                    </div>

                                    <div className="run-stat-row">
                                        <div className="run-stat-label">
                                            <Calendar className="run-stat-icon"/>
                                            <span>Date</span>
                                        </div>
                                        <span className="run-stat-value date">
                      {new Date().toLocaleDateString()}
                    </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {character.mythicPlusBestRuns.length === 0 && (
                    <div className="empty-runs-state">
                        <Award className="empty-runs-icon"/>
                        <h3 className="empty-runs-title">No runs recorded</h3>
                        <p className="empty-runs-text">
                            Complete some Mythic+ dungeons to see your best runs here
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}