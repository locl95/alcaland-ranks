import { EU_REALMS } from "@/features/views/constants/euRealms.ts";
import { NA_REALMS } from "@/features/views/constants/naRealms.ts";

interface RealmSelectProps {
  region: string;
  realm: string;
  onRegionChange: (region: string) => void;
  onRealmChange: (realm: string) => void;
}

export function RealmSelect({
  region,
  realm,
  onRegionChange,
  onRealmChange,
}: Readonly<RealmSelectProps>) {
  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onRegionChange(e.target.value);
    onRealmChange("");
  };

  return (
    <>
      <select
        className="form-select form-select-region"
        value={region}
        onChange={handleRegionChange}
      >
        <option value="eu">EU</option>
        <option value="us">NA</option>
      </select>

      <select
        className="form-select"
        value={realm}
        onChange={(e) => onRealmChange(e.target.value)}
      >
        <option value="">Realm</option>
        {(region === "us" ? NA_REALMS : EU_REALMS).map((r) => (
          <option key={r.slug} value={r.slug}>
            {r.label}
          </option>
        ))}
      </select>
    </>
  );
}
