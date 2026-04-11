import { RaiderioProfile } from "@/features/views/api/raiderio.ts";

const getRankChange = (current: number, previous?: number): number | null => {
  if (previous === undefined) return null;
  return previous - current;
};

const formatRankChange = (change: number): string => {
  const formatted = Math.round(Math.abs(change)).toLocaleString();
  return change > 0 ? `+${formatted}` : `-${formatted}`;
};

interface SpecRankingsTableProps {
  character: RaiderioProfile;
  cachedProfile: RaiderioProfile | undefined;
}

export function SpecRankingsTable({
  character,
  cachedProfile,
}: Readonly<SpecRankingsTableProps>) {
  const specs = character.mythicPlusRanks.specs.filter((s) => s.score > 0);

  if (specs.length === 0) return null;

  return (
    <div className="rankings-section">
      <h4 className="rankings-section-title">Spec Rankings</h4>
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
            {specs.map((spec) => {
              const cachedSpec = cachedProfile?.mythicPlusRanks.specs.find(
                (s) => s.name === spec.name,
              );
              return (
                <tr key={spec.name} className="spec-tr">
                  <td className="spec-td spec-td--name">{spec.name}</td>
                  <td className="spec-td spec-td--score">
                    {Math.round(spec.score).toLocaleString()}
                  </td>
                  {(["world", "region", "realm"] as const).map((key) => {
                    const change = getRankChange(spec[key], cachedSpec?.[key]);
                    return (
                      <td key={key} className="spec-td spec-td--rank">
                        <span className="spec-rank-value">
                          #{Math.round(spec[key]).toLocaleString()}
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
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
