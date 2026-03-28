import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Trophy,
} from "lucide-react";
import "@/styles/features/views/character-ladder.css";
import { useEffect, useRef, useState } from "react";
import { RaiderioProfile } from "@/features/views/api/Raiderio.tsx";
import raiderio2 from "@/assets/raiderio.png";
import summoned from "@/assets/summoned.png";

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
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const getScoreClass = (score: number): string => {
    if (score < 300)  return "score-grey";
    if (score < 1100)  return "score-green";
    if (score < 1800) return "score-blue";
    if (score < 3000) return "score-purple";
    return "score-orange";
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

  const formatRankChange = (change: number): string => {
    const formatted = Math.round(Math.abs(change)).toLocaleString();
    return change > 0 ? `+${formatted}` : `-${formatted}`;
  };

  return (
    <div className="ladder-card">
      <div
        className="ladder-header"
        onClick={() => {
          if (isLadderOpen) setExpandedCharacters(new Set());
          setIsLadderOpen(!isLadderOpen);
        }}
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
                        <p className={`ladder-score-value ${getScoreClass(character.score)}`}>
                          {character.score.toLocaleString()}
                        </p>
                        <p className="ladder-score-label">M+ Score</p>
                      </div>

                      <div className="ladder-actions">
                        <div
                          className="char-menu-wrapper"
                          ref={openMenuId === character.id ? menuRef : null}
                        >
                          <button
                            className="char-menu-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(
                                openMenuId === character.id
                                  ? null
                                  : character.id,
                              );
                            }}
                          >
                            <MoreHorizontal className="chevron-icon" />
                          </button>
                          {openMenuId === character.id && (
                            <div className="char-menu-dropdown">
                              <button
                                className="char-menu-item"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openRaiderIO(character);
                                  setOpenMenuId(null);
                                }}
                              >
                                <img
                                  src={raiderio2}
                                  alt=""
                                  aria-hidden={true}
                                  className="char-menu-icon"
                                />
                                Raider.io
                              </button>
                              <button
                                className="char-menu-item"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openSummonedIO(character);
                                  setOpenMenuId(null);
                                }}
                              >
                                <img
                                  src={summoned}
                                  alt=""
                                  aria-hidden={true}
                                  className="char-menu-icon"
                                />
                                Summoned.io
                              </button>
                            </div>
                          )}
                        </div>

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
                      <h4 className="rankings-section-title">Rankings</h4>
                      <div className="table-scroll">
                        <table className="rankings-table">
                          <thead>
                            <tr>
                              <th className="rankings-th rankings-th--label" />
                              <th className="rankings-th">World</th>
                              <th className="rankings-th">Region</th>
                              <th className="rankings-th">Realm</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(["overall", "class"] as const).map((rankType) => (
                              <tr key={rankType} className="rankings-tr">
                                <td className="rankings-td-label">
                                  {rankType === "overall"
                                    ? "Overall"
                                    : character.class}
                                </td>
                                {(["world", "region", "realm"] as const).map(
                                  (key) => {
                                    const current =
                                      character.mythicPlusRanks[rankType][key];
                                    const previous =
                                      cachedRaiderIoProfile?.mythicPlusRanks[
                                        rankType
                                      ][key];
                                    const change = getRankChange(
                                      current,
                                      previous,
                                    );
                                    return (
                                      <td key={key} className="rankings-td">
                                        <span className="ranking-value">
                                          #
                                          {Math.round(current).toLocaleString()}
                                        </span>
                                        {change !== null && change !== 0 && (
                                          <span
                                            className={`rank-change ${change > 0 ? "improved" : "declined"}`}
                                          >
                                            {formatRankChange(change)}
                                          </span>
                                        )}
                                      </td>
                                    );
                                  },
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {character.mythicPlusRanks.specs.filter((s) => s.score > 0)
                      .length > 0 && (
                      <div className="rankings-section">
                        <h4 className="rankings-section-title">
                          Spec Rankings
                        </h4>
                        <div className="table-scroll">
                          <table className="spec-table">
                            <thead>
                              <tr>
                                <th className="spec-th spec-th--name">Spec</th>
                                <th className="spec-th spec-th--num">Score</th>
                                <th className="spec-th spec-th--num">World</th>
                                <th className="spec-th spec-th--num">Region</th>
                                <th className="spec-th spec-th--num">Realm</th>
                              </tr>
                            </thead>
                            <tbody>
                              {character.mythicPlusRanks.specs
                                .filter((s) => s.score > 0)
                                .map((spec) => {
                                  const cachedSpec =
                                    cachedRaiderIoProfile?.mythicPlusRanks.specs.find(
                                      (s) => s.name === spec.name,
                                    );
                                  return (
                                    <tr key={spec.name} className="spec-tr">
                                      <td className="spec-td spec-td--name">
                                        {spec.name}
                                      </td>
                                      <td className="spec-td spec-td--score">
                                        {Math.round(
                                          spec.score,
                                        ).toLocaleString()}
                                      </td>
                                      {(
                                        ["world", "region", "realm"] as const
                                      ).map((key) => {
                                        const change = getRankChange(
                                          spec[key],
                                          cachedSpec?.[key],
                                        );
                                        return (
                                          <td
                                            key={key}
                                            className="spec-td spec-td--rank"
                                          >
                                            <span className="spec-rank-value">
                                              #
                                              {Math.round(
                                                spec[key],
                                              ).toLocaleString()}
                                            </span>
                                            {change !== null &&
                                              change !== 0 && (
                                                <span
                                                  className={`rank-change ${change > 0 ? "improved" : "declined"}`}
                                                >
                                                  {formatRankChange(change)}
                                                </span>
                                              )}
                                          </td>
                                        );
                                      })}
                                    </tr>
                                  );
                                })}
                            </tbody>
                          </table>
                        </div>
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
