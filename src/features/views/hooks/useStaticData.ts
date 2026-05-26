import { useQuery } from '@tanstack/react-query';
import { viewKeys, fetchWowStatic } from '@/features/views/api/viewQueries.ts';

export function useStaticData() {
  return useQuery({
    queryKey: viewKeys.static(),
    queryFn: fetchWowStatic,
    staleTime: Infinity,
  });
}
