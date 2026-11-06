import { useChampion } from '@/games/lol/api/data-dragon.ts';

interface ChampionIconProps {
  championId: number;
  championName: string;
  className?: string;
}

export function ChampionIcon({ championId, championName, className }: Readonly<ChampionIconProps>) {
  const champion = useChampion()(championId);
  const name = champion?.name ?? championName;
  return champion ? (
    <img className={className} src={champion.iconUrl} alt={name} title={name} />
  ) : (
    <span className={className} title={name} aria-label={name} />
  );
}
