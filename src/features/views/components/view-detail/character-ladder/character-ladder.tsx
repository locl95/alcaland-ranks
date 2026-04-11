import { ChevronDown, ChevronUp, Trophy } from "lucide-react";
import "./character-ladder.css";
import { useState } from "react";
import { RaiderioProfile, Season } from "@/features/views/api/raiderio.ts";
import { LadderRow } from "./ladder-row.tsx";

interface CharacterLadderProps {
  characters: RaiderioProfile[];
  cachedCharacters: RaiderioProfile[];
  season: Season | null;
}

export function CharacterLadder({
  characters,
  cachedCharacters,
  season,
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

  const getCachedProfile = (
    character: RaiderioProfile,
  ): RaiderioProfile | undefined =>
    cachedCharacters.find((c) => c.id === character.id);

  const getLadderPositionChange = (
    character: RaiderioProfile,
  ): number | null => {
    if (!hasHistoricalData) return null;
    const currentIndex = sortedCharacters.findIndex(
      (c) => c.id === character.id,
    );
    const previousIndex = sortedCachedCharacters.findIndex(
      (c) => c.id === character.id,
    );
    if (currentIndex === -1 || previousIndex === -1) return null;
    return previousIndex + 1 - (currentIndex + 1);
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
          {sortedCharacters.map((character, index) => (
            <LadderRow
              index={index}
              character={character}
              cachedCharacter={getCachedProfile(character)}
              season={season}
              isExpanded={expandedCharacters.has(character.id)}
              hasHistoricalData={hasHistoricalData}
              positionChange={getLadderPositionChange(character)}
              onToggle={() => toggleCharacter(character.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
