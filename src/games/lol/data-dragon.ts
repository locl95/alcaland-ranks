import { useQuery } from '@tanstack/react-query';

const DDRAGON = 'https://ddragon.leagueoflegends.com';

const fetchLatestVersion = async (): Promise<string> => {
  const response = await fetch(`${DDRAGON}/api/versions.json`);
  if (!response.ok) throw new Error(`Data Dragon versions: ${response.status}`);
  const versions: string[] = await response.json();
  return versions[0];
};

export function useDataDragonVersion(): string | undefined {
  const { data } = useQuery({
    queryKey: ['dataDragonVersion'],
    queryFn: fetchLatestVersion,
    staleTime: Infinity,
  });
  return data;
}

interface ChampionSummary {
  data: Record<string, { key: string; name: string; image: { full: string } }>;
}

export interface Champion {
  name: string;
  iconUrl: string;
}

const fetchChampions = async (version: string): Promise<Map<number, Champion>> => {
  const response = await fetch(`${DDRAGON}/cdn/${version}/data/en_US/champion.json`);
  if (!response.ok) throw new Error(`Data Dragon champions: ${response.status}`);
  const { data }: ChampionSummary = await response.json();
  return new Map(
    Object.values(data).map((c) => [
      Number(c.key),
      { name: c.name, iconUrl: `${DDRAGON}/cdn/${version}/img/champion/${c.image.full}` },
    ]),
  );
};

export function useChampion(): (championId: number) => Champion | undefined {
  const version = useDataDragonVersion();
  const { data: champions } = useQuery({
    queryKey: ['dataDragonChampions', version],
    queryFn: () => fetchChampions(version!),
    enabled: version !== undefined,
    staleTime: Infinity,
  });
  return (championId) => champions?.get(championId);
}

export const profileIconUrl = (version: string, iconId: number): string =>
  `${DDRAGON}/cdn/${version}/img/profileicon/${iconId}.png`;
