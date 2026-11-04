import './roster-row.css';
import { Swords } from 'lucide-react';
import { RunDetailsMember } from '@/features/views/api/wow-types.ts';
import { SPEC_IMAGES, getSpecImageKey } from '@/features/views/constants/spec-images.ts';
import { ROLE_IMAGES } from '@/features/views/constants/role-images.ts';
import { CLASS_TEXT_COLORS } from '@/features/views/constants/class-colors.ts';
import { getClassSlug, openExternalProfile, toRealmLabel } from '@/features/views/utils.ts';

const ROLE_LABEL: Record<string, string> = {
  tank: 'Tank',
  healer: 'Healer',
  dps: 'Damage dealer',
};

interface RosterRowProps {
  member: RunDetailsMember;
  characterRegion: string;
}

export function RosterRow({ member, characterRegion }: Readonly<RosterRowProps>) {
  const specImg = SPEC_IMAGES[getSpecImageKey(member.class, member.spec.name)];
  const role = member.spec.role;

  return (
    <div className="run-details-row">
      <div className="run-details-icons">
        {ROLE_IMAGES[role] && (
          <img
            src={ROLE_IMAGES[role]}
            alt={ROLE_LABEL[role] ?? role}
            title={ROLE_LABEL[role] ?? role}
            className="role-icon"
          />
        )}
        {specImg && (
          <img
            src={specImg}
            alt={member.spec.name}
            title={member.spec.name}
            className="spec-icon"
          />
        )}
      </div>
      <div
        className="run-details-character-info"
        onClick={(e) => {
          e.stopPropagation();
          openExternalProfile(
            {
              name: member.name,
              realm: member.realm,
              region: characterRegion,
            },
            'raiderio',
          );
        }}
      >
        <span className="run-details-name">
          <span
            style={{
              color: CLASS_TEXT_COLORS[getClassSlug(member.class)] ?? 'var(--ink)',
            }}
          >
            {member.name}
          </span>
        </span>
        <span className="run-details-realm">{toRealmLabel(member.realm, characterRegion)}</span>
      </div>
      <span className="run-details-ilvl" title="Equipped item level">
        <Swords className="run-details-ilvl-icon" aria-hidden="true" />
        {member.itemLevel}
      </span>
    </div>
  );
}
