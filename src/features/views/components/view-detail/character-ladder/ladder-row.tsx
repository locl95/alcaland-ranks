import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import "./ladder-row.css";
import { RaiderioProfile, Season } from "@/features/views/api/raiderio.ts";
import { CharacterMenu } from "./character-menu.tsx";
import { LadderRowExpanded } from "./ladder-row-expanded.tsx";

import { getClassSlug, getScoreClass } from "@/features/views/utils.ts";

interface LadderRowProps {
  index: number;
  character: RaiderioProfile;
  cachedCharacter: RaiderioProfile | undefined;
  season: Season | null;
  isExpanded: boolean;
  hasHistoricalData: boolean;
  positionChange: number | null;
  onToggle: () => void;
}

export function LadderRow({
  index,
  character,
  cachedCharacter,
  season,
  isExpanded,
  hasHistoricalData,
  positionChange,
  onToggle,
}: Readonly<LadderRowProps>) {
  const isSyncing = character.score === -1;

  return (
    <div className="ladder-row">
      <div className="ladder-row-inner" onClick={onToggle}>
        <div className="ladder-rank">{index + 1}</div>

        <div className="ladder-character-info">
          <div className="ladder-character-name-row">
            <p className="ladder-character-name">{character.name}</p>
            {!isSyncing &&
              hasHistoricalData &&
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
          cachedCharacter={cachedCharacter}
          season={season}
        />
      )}
    </div>
  );
}
