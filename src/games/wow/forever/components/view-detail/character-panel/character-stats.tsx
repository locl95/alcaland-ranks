import { WowStats } from '@/games/wow/forever/api/forever-types.ts';
import { StatGroup, resistanceLines, statGroups } from '@/games/wow/forever/model/stats.ts';
import './character-stats.css';

interface CharacterStatsProps {
  stats: WowStats;
  offHandWeapon: boolean;
}

/** The game's character pane numbers, in groups, between the two columns of items. */
export function CharacterStats({ stats, offHandWeapon }: Readonly<CharacterStatsProps>) {
  const groups: StatGroup[] = [
    ...statGroups(stats, offHandWeapon),
    { title: 'Resistances', lines: resistanceLines(stats) },
  ];

  return (
    <div className="character-stats">
      {groups.map((group) => (
        <div key={group.title} className={`stat-group stat-group--${group.title.toLowerCase()}`}>
          <h4 className="stat-group-title">{group.title}</h4>
          <dl>
            {group.lines.map((line) => (
              <div key={line.label} className="stat-line">
                <dt>{line.label}</dt>
                <dd className="num">{line.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
}
