import { useQuery } from '@tanstack/react-query';
import { wowStaticKey, fetchWowStatic } from '@/games/wow/api/wow-static.ts';

export function useStaticData() {
  return useQuery({
    queryKey: wowStaticKey(),
    queryFn: fetchWowStatic,
    staleTime: Infinity,
  });
}
