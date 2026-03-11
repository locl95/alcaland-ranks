import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Trophy,
} from "lucide-react";
import "./character-ladder.css";
import { RaiderioProfile } from "@/app/utils/raiderio.ts";
import { useState } from "react";

interface CharacterLadderProps {
  characters: RaiderioProfile[];
  cachedCharacters: RaiderioProfile[];
}

export function CharacterLadder({
  characters,
  cachedCharacters,
}: Readonly<CharacterLadderProps>) {
  const [isLadderOpen, setIsLadderOpen] = useState(true);
  const [expandedCharacters, setExpandedCharacters] = useState<Set<string>>(
    new Set(),
  );

  const sortedCharacters = [...characters].sort((a, b) => b.score - a.score);
  const sortedCachedCharacters = [...cachedCharacters].sort(
    (a, b) => b.score - a.score,
  );

  const openRaiderIO = (character: RaiderioProfile) => {
    // Raider.IO URL format: https://raider.io/characters/region/realm/name
    // Assuming EU region for this example - you may want to add region to Character type
    const realm = "Sanguino".replace(/\s+/g, "-");
    const name = character.name.toLowerCase();
    const url = `https://raider.io/characters/eu/${realm}/${name}`;
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
      (cachedProfile) => cachedProfile.id == character.id,
    );
  };

  const getClassSlug = (className: string): string => {
    return className.toLowerCase().replace(/\s+/g, "-");
  };

  const getLadderPositionChange = (
    raiderIoProfile: RaiderioProfile,
    cachedRaiderIoProfile: RaiderioProfile | undefined,
  ): number | null => {
    if (cachedRaiderIoProfile == undefined) return null;

    const currentPosition =
      sortedCharacters
        .filter((c) => c.score > 0)
        .findIndex((c) => c.id === raiderIoProfile.id) + 1;
    const previousPosition =
      sortedCachedCharacters.findIndex((c) => c.id === raiderIoProfile.id) + 1;

    return previousPosition - currentPosition;
  };

  const getRankChange = (currentRank: number, previousRank: number): number => {
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
            const cachedRaiderIoProfile = getCachedRaiderIoProfile(
              cachedCharacters,
              character,
            );
            const positionChange = getLadderPositionChange(
              character,
              cachedRaiderIoProfile,
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
                        positionChange !== null &&
                        positionChange !== 0 && (
                          <span
                            className={`ladder-position-change ${positionChange > 0 ? "improved" : "declined"}`}
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
                          className={`class-badge ${getClassSlug(character.class)}`}
                        >
                          {character.class}
                        </span>
                        <span className="ladder-character-spec">
                          {character.spec}
                        </span>
                        <span className="ladder-character-realm">
                          • {"Sanguino"}
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
                          <ExternalLink className="external-icon" />
                          Raider.IO
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
                            {cachedRaiderIoProfile?.mythicPlusRanks.overall.world.toLocaleString() &&
                              (() => {
                                const change = getRankChange(
                                  character.mythicPlusRanks.overall.world,
                                  cachedRaiderIoProfile?.mythicPlusRanks.overall
                                    .world,
                                );
                                return change === 0 ? null : (
                                  <span
                                    className={`rank-change ${change > 0 ? "improved" : "declined"}`}
                                  >
                                    {change > 0 ? `+${change}` : change}
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
                            {cachedRaiderIoProfile?.mythicPlusRanks.overall.world.toLocaleString() &&
                              (() => {
                                const change = getRankChange(
                                  character.mythicPlusRanks.overall.region,
                                  cachedRaiderIoProfile?.mythicPlusRanks.overall
                                    .region,
                                );
                                return change === 0 ? null : (
                                  <span
                                    className={`rank-change ${change > 0 ? "improved" : "declined"}`}
                                  >
                                    {change > 0 ? `+${change}` : change}
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
                              {character.mythicPlusRanks.overall.realm.toLocaleString()}
                            </span>
                            {cachedRaiderIoProfile?.mythicPlusRanks.overall.realm.toLocaleString() &&
                              (() => {
                                const change = getRankChange(
                                  character.mythicPlusRanks.overall.realm,
                                  cachedRaiderIoProfile?.mythicPlusRanks.overall
                                    .realm,
                                );
                                return change === 0 ? null : (
                                  <span
                                    className={`rank-change ${change > 0 ? "improved" : "declined"}`}
                                  >
                                    {change > 0 ? `+${change}` : change}
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
                          .filter((spec) => spec.score > 1000)
                          .map((spec) => {
                            const previousSpec =
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
                                    ({spec.score.toLocaleString()})
                                  </span>
                                </div>
                                <div className="rankings-grid">
                                  <div className="ranking-item">
                                    <span className="ranking-label">World</span>
                                    <div className="ranking-value-row">
                                      <span className="ranking-value">
                                        #{spec.world.toLocaleString()}
                                      </span>
                                      {previousSpec &&
                                        (() => {
                                          const change = getRankChange(
                                            spec.world,
                                            previousSpec.world,
                                          );
                                          return change === 0 ? null : (
                                            <span
                                              className={`rank-change ${change > 0 ? "improved" : "declined"}`}
                                            >
                                              {change > 0
                                                ? `+${change}`
                                                : change}
                                            </span>
                                          );
                                        })()}
                                    </div>
                                  </div>
                                  <div className="ranking-item">
                                    <span className="ranking-label">
                                      Region
                                    </span>
                                    <div className="ranking-value-row">
                                      <span className="ranking-value">
                                        #{spec.region.toLocaleString()}
                                      </span>
                                      {previousSpec &&
                                        (() => {
                                          const change = getRankChange(
                                            spec.region,
                                            previousSpec.region,
                                          );
                                          return change === 0 ? null : (
                                            <span
                                              className={`rank-change ${change > 0 ? "improved" : "declined"}`}
                                            >
                                              {change > 0
                                                ? `+${change}`
                                                : change}
                                            </span>
                                          );
                                        })()}
                                    </div>
                                  </div>
                                  <div className="ranking-item">
                                    <span className="ranking-label">Realm</span>
                                    <div className="ranking-value-row">
                                      <span className="ranking-value">
                                        #{spec.realm.toLocaleString()}
                                      </span>
                                      {previousSpec &&
                                        (() => {
                                          const change = getRankChange(
                                            spec.realm,
                                            previousSpec.realm,
                                          );
                                          return change === 0 ? null : (
                                            <span
                                              className={`rank-change ${change > 0 ? "improved" : "declined"}`}
                                            >
                                              {change > 0
                                                ? `+${change}`
                                                : change}
                                            </span>
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
  );
}
