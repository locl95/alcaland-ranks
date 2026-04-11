import { RaiderioProfile } from "@/features/views/api/raiderio.ts";

const getRankChange = (current: number, previous?: number): number | null => {
  if (previous === undefined) return null;
  return previous - current;
};

const formatRankChange = (change: number): string => {
  const formatted = Math.round(Math.abs(change)).toLocaleString();
  return change > 0 ? `+${formatted}` : `-${formatted}`;
};

interface RankingsTableProps {
  character: RaiderioProfile;
  cachedProfile: RaiderioProfile | undefined;
}

export function RankingsTable({
  character,
  cachedProfile,
}: Readonly<RankingsTableProps>) {
  return (
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
                  {rankType === "overall" ? "Overall" : character.class}
                </td>
                {(["world", "region", "realm"] as const).map((key) => {
                  const current = character.mythicPlusRanks[rankType][key];
                  const previous =
                    cachedProfile?.mythicPlusRanks[rankType][key];
                  const change = getRankChange(current, previous);
                  return (
                    <td key={key} className="rankings-td">
                      <span className="ranking-value">
                        #{Math.round(current).toLocaleString()}
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
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
