import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Trophy
} from "lucide-react";
import "@/styles/features/views/character-ladder.css";
import { useState } from "react";
import { RaiderioProfile } from "@/features/views/api/Raiderio.tsx";
import raiderio2 from "@/assets/raiderio.png"
import summoned from "@/assets/summoned.png"

interface CharacterLadderProps {
  characters: RaiderioProfile[];
  cachedCharacters: RaiderioProfile[];
}

export function CharacterLadder({
  characters,
  cachedCharacters,
}: Readonly<CharacterLadderProps>) {
  const [isLadderOpen, setIsLadderOpen] = useState(true);
  const [expandedCharacters, setExpandedCharacters] = useState<Set<number>>(
    new Set(),
  );

  const sortedCharacters = [...characters].sort((a, b) => b.score - a.score);
  const sortedCachedCharacters = [...cachedCharacters].sort(
    (a, b) => b.score - a.score,
  );

  const hasHistoricalData = cachedCharacters.length > 0;

  const openRaiderIO = (character: RaiderioProfile) => {
    const realm = character.realm.replace(/\s+/g, "-");
    const name = character.name.toLowerCase();
    const region = character.region.toLowerCase();
    const url = `https://raider.io/characters/${region}/${realm}/${name}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const openSummonedIO = (character: RaiderioProfile) => {
    const realm = character.realm.replace(/\s+/g, "-");
    const name = character.name.toLowerCase();
    const region = character.region.toLowerCase();
    const url = `https://summoned.io/${region}/${realm}/${name}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const toggleCharacter = (characterId: number) => {
    setExpandedCharacters((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(characterId)) {
        newSet.delete(characterId);
      } else {
        newSet.add(characterId);
      }
      return newSet;
    });
  };

  const getCachedRaiderIoProfile = (
    raiderioCachedProfiles: RaiderioProfile[],
    character: RaiderioProfile,
  ): RaiderioProfile | undefined => {
    return raiderioCachedProfiles.find(
      (cachedProfile) => cachedProfile.id === character.id,
    );
  };

  const getClassSlug = (className: string): string => {
    return className.toLowerCase().replace(/\s+/g, "-");
  };

  const getLadderPositionChange = (
    raiderIoProfile: RaiderioProfile,
  ): number | null => {
    if (!hasHistoricalData) return null;

    const currentIndex = sortedCharacters.findIndex(
      (c) => c.id === raiderIoProfile.id,
    );

    const previousIndex = sortedCachedCharacters.findIndex(
      (c) => c.id === raiderIoProfile.id,
    );

    if (currentIndex === -1 || previousIndex === -1) return null;

    const currentPosition = currentIndex + 1;
    const previousPosition = previousIndex + 1;

    return previousPosition - currentPosition;
  };

  const getRankChange = (
    currentRank: number,
    previousRank?: number,
  ): number | null => {
    if (previousRank === undefined) return null;
    return previousRank - currentRank;
  };

  return (
    <div className="ladder-card">
      <div
        className="ladder-header"
        onClick={() => setIsLadderOpen(!isLadderOpen)}
      >
        <div className="ladder-title">
          <Trophy className="trophy-icon" />
          Character Ladder
        </div>
        <button className="ladder-toggle-btn">
          {isLadderOpen ? (
            <ChevronUp className="chevron-icon" />
          ) : (
            <ChevronDown className="chevron-icon" />
          )}
        </button>
      </div>

      {isLadderOpen && (
        <div className="ladder-content">
          {sortedCharacters.map((character, index) => {
            const isExpanded = expandedCharacters.has(character.id);
            const isSyncing = character.score == -1;
            const positionChange = getLadderPositionChange(character);

            const cachedRaiderIoProfile = getCachedRaiderIoProfile(
              cachedCharacters,
              character,
            );

            return (
              <div key={character.id} className="ladder-row">
                <div
                  className="ladder-row-inner"
                  onClick={() => toggleCharacter(character.id)}
                >
                  <div className="ladder-rank">{index + 1}</div>

                  <div className="ladder-character-info">
                    <div className="ladder-character-name-row">
                      <p className="ladder-character-name">{character.name}</p>

                      {!isSyncing &&
                        hasHistoricalData &&
                        positionChange !== null &&
                        positionChange !== 0 && (
                          <span
                            className={`ladder-position-change ${
                              positionChange > 0 ? "improved" : "declined"
                            }`}
                          >
                            {positionChange > 0
                              ? `↑ ${positionChange}`
                              : `↓ ${Math.abs(positionChange)}`}
                          </span>
                        )}
                    </div>

                    {!isSyncing && (
                      <div className="ladder-character-meta">
                        <span
                          className={`class-badge ${getClassSlug(
                            character.class,
                          )}`}
                        >
                          {character.class}
                        </span>
                        <span className="ladder-character-spec">
                          {character.spec}
                        </span>
                        <span className="ladder-character-realm">
                          • {character.realm}
                        </span>
                      </div>
                    )}
                  </div>

                  {isSyncing ? (
                    <div className="ladder-syncing-indicator">
                      <div className="syncing-warning-wrapper">
                        <AlertTriangle className="syncing-warning-icon" />
                        <span className="syncing-tooltip">
                          Character being synced
                        </span>
                      </div>
                    </div>
                  ) : (
                    <>
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
                          <img src={raiderio2} alt={'Raider IO'} aria-hidden={true} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openSummonedIO(character);
                          }}
                          className="raider-io-btn"
                        >
                          <img src={summoned} alt={'Summoned IO'} aria-hidden={true} />
                        </button>

                        <button className="expand-btn">
                          {isExpanded ? (
                            <ChevronUp className="chevron-icon" />
                          ) : (
                            <ChevronDown className="chevron-icon" />
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {isExpanded && character.mythicPlusRanks && (
                  <div className="ladder-row-expanded">
                    <div className="rankings-section">
                      <h4 className="rankings-section-title">
                        Overall Rankings
                      </h4>

                      <div className="rankings-grid">
                        <div className="ranking-item">
                          <span className="ranking-label">World</span>
                          <div className="ranking-value-row">
                            <span className="ranking-value">
                              #
                              {character.mythicPlusRanks.overall.world.toLocaleString()}
                            </span>

                            {cachedRaiderIoProfile &&
                              (() => {
                                const change = getRankChange(
                                  character.mythicPlusRanks.overall.world,
                                  cachedRaiderIoProfile.mythicPlusRanks.overall
                                    .world,
                                );

                                return change === null ||
                                  change === 0 ? null : (
                                  <span
                                    className={`rank-change ${
                                      change > 0 ? "improved" : "declined"
                                    }`}
                                  >
                                    {change > 0 ? `+${Math.round(change)}` : Math.round(change)}
                                  </span>
                                );
                              })()}
                          </div>
                        </div>

                        <div className="ranking-item">
                          <span className="ranking-label">Region</span>
                          <div className="ranking-value-row">
                            <span className="ranking-value">
                              #
                              {character.mythicPlusRanks.overall.region.toLocaleString()}
                            </span>

                            {cachedRaiderIoProfile &&
                              (() => {
                                const change = getRankChange(
                                  character.mythicPlusRanks.overall.region,
                                  cachedRaiderIoProfile.mythicPlusRanks.overall
                                    .region,
                                );

                                return change === null ||
                                  change === 0 ? null : (
                                  <span
                                    className={`rank-change ${
                                      change > 0 ? "improved" : "declined"
                                    }`}
                                  >
                                    {change > 0 ? `+${Math.round(change)}` : Math.round(change)}
                                  </span>
                                );
                              })()}
                          </div>
                        </div>

                        <div className="ranking-item">
                          <span className="ranking-label">Realm</span>
                          <div className="ranking-value-row">
                            <span className="ranking-value">
                              #
                              {Math.round(character.mythicPlusRanks.overall.realm).toLocaleString()}
                            </span>

                            {cachedRaiderIoProfile &&
                              (() => {
                                const change = getRankChange(
                                  character.mythicPlusRanks.overall.realm,
                                  cachedRaiderIoProfile.mythicPlusRanks.overall
                                    .realm,
                                );

                                return change === null ||
                                  change === 0 ? null : (
                                  <span
                                    className={`rank-change ${
                                      change > 0 ? "improved" : "declined"
                                    }`}
                                  >
                                    {change > 0 ? `+${Math.round(change)}` : Math.round(change)}
                                  </span>
                                );
                              })()}
                          </div>
                        </div>
                      </div>
                    </div>

                    {character.mythicPlusRanks.specs.length > 0 && (
                      <div className="rankings-section">
                        <h4 className="rankings-section-title">
                          Spec Rankings
                        </h4>

                        {character.mythicPlusRanks.specs
                            .filter((spec) => spec.score > 0)
                            .map((spec) => {
                          const cachedSpec =
                            cachedRaiderIoProfile?.mythicPlusRanks.specs.find(
                              (s) => s.name === spec.name,
                            );

                          return (
                            <div key={spec.name} className="spec-ranking">
                              <div className="spec-ranking-header">
                                <span className="spec-ranking-name">
                                  {spec.name}
                                </span>
                                <span className="spec-ranking-score">
                                  {Math.round(spec.score).toLocaleString()}
                                </span>
                              </div>

                              <div className="rankings-grid">
                                {(
                                  [
                                    ["World", "world"],
                                    ["Region", "region"],
                                    ["Realm", "realm"],
                                  ] as const
                                ).map(([label, key]) => {
                                  const change = getRankChange(
                                    spec[key],
                                    cachedSpec?.[key],
                                  );

                                  return (
                                    <div key={key} className="ranking-item">
                                      <span className="ranking-label">
                                        {label}
                                      </span>
                                      <div className="ranking-value-row">
                                        <span className="ranking-value">
                                          #{Math.round(spec[key]).toLocaleString()}
                                        </span>
                                        {change !== null && change !== 0 && (
                                          <span
                                            className={`rank-change ${change > 0 ? "improved" : "declined"}`}
                                          >
                                            {change > 0
                                              ? `+${Math.round(change)}`
                                              : Math.round(change)}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
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
  );
}