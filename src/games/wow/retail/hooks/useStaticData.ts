import { useQuery } from '@tanstack/react-query';
import { wowStaticKey, fetchWowStatic } from '@/games/wow/retail/api/wow-static.ts';

export function useStaticData() {
  return useQuery({
    queryKey: wowStaticKey(),
    queryFn: fetchWowStatic,
    staleTime: Infinity,
  });
}
