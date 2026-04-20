import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import "./ladder-row.css";
import { useState } from "react";
import { RaiderioProfile, Season } from "@/features/views/api/raiderio.ts";
import { CharacterMenu } from "./character-menu.tsx";
import { LadderRowExpanded } from "./ladder-row-expanded.tsx";

import { getClassSlug, getScoreClass } from "@/features/views/utils.ts";

interface LadderRowProps {
  index: number;
  character: RaiderioProfile;
  cachedCharacters: RaiderioProfile[];
  season: Season | null;
}

export function LadderRow({
  index,
  character,
  cachedCharacters,
  season,
}: Readonly<LadderRowProps>) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isSyncing = character.score === -1;
  const hasHistoricalData = cachedCharacters.length > 0;
  const cachedIndex = cachedCharacters.findIndex((c) => c.id === character.id);
  const positionChange =
    hasHistoricalData && cachedIndex !== -1 ? cachedIndex - index : null;

  const showPositionChange = !isSyncing && hasHistoricalData && positionChange !== null && positionChange !== 0;

  return (
    <div className="ladder-row">
      <div className="ladder-row-inner" onClick={() => setIsExpanded((prev) => !prev)}>
        <div className="ladder-rank">{index + 1}</div>

        <div className="ladder-character-info">
          <div className="ladder-character-name-row">
            <p className="ladder-character-name">{character.name}</p>
            {showPositionChange && (
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
              <span className={`class-badge ${getClassSlug(character.class)}`}>
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
              <span className="syncing-tooltip">Character is syncing</span>
            </div>
          </div>
        ) : (
          <>
            <div className="ladder-score">
              <p
                className={`ladder-score-value ${getScoreClass(character.score)}`}
              >
                {character.score.toLocaleString()}
              </p>
              <p className="ladder-score-label">M+ Score</p>
            </div>
            <div className="ladder-actions">
              <CharacterMenu character={character} />
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
        <LadderRowExpanded
          character={character}
          cachedCharacter={cachedCharacters[cachedIndex]}
          season={season}
        />
      )}
    </div>
  );
}
