import "./roster-row.css";
import { RunDetailsRosterEntry } from "@/features/views/api/raiderio.ts";
import { SPEC_IMAGES, getSpecImageKey } from "@/features/views/constants/spec-images.ts";
import { ROLE_IMAGES } from "@/features/views/constants/role-images.ts";
import { CLASS_COLORS } from "@/features/views/constants/class-colors.ts";
import { getClassSlug, getScoreClass, openExternalProfile } from "@/features/views/utils.ts";

const ROLE_LABEL: Record<string, string> = { tank: "Tank", healer: "Healer", dps: "Damage dealer" };

interface RosterRowProps {
  entry: RunDetailsRosterEntry;
  characterRegion: string;
}

export function RosterRow({ entry, characterRegion }: Readonly<RosterRowProps>) {
  const specImg = SPEC_IMAGES[getSpecImageKey(entry.character.class.name, entry.character.spec.name)];

  return (
    <div className="run-details-row">
      <div className="run-details-icons">
        {ROLE_IMAGES[entry.role] && (
          <img
            src={ROLE_IMAGES[entry.role]}
            alt={ROLE_LABEL[entry.role] ?? entry.role}
            title={ROLE_LABEL[entry.role] ?? entry.role}
            className="role-icon"
          />
        )}
        {specImg && (
          <img
            src={specImg}
            alt={entry.character.spec.name}
            title={entry.character.spec.name}
            className="spec-icon"
          />
        )}
      </div>
      <div
        className="run-details-character-info"
        onClick={(e) => {
          e.stopPropagation();
          openExternalProfile(
            { name: entry.character.name, realm: entry.character.realm.slug, region: characterRegion },
            "raiderio",
          );
        }}
      >
        <span className="run-details-name">
          <span style={{ color: CLASS_COLORS[getClassSlug(entry.character.class.name)] ?? "#94a3b8" }}>
            {entry.character.name}
          </span>
        </span>
        <span className="run-details-realm">{entry.character.realm.name}</span>
      </div>
      <span className={`run-details-score ${getScoreClass(entry.ranks.score)}`}>
        {Math.round(entry.ranks.score)}
      </span>
    </div>
  );
}
