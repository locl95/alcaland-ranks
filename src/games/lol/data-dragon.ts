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

export const profileIconUrl = (version: string, iconId: number): string =>
  `${DDRAGON}/cdn/${version}/img/profileicon/${iconId}.png`;
