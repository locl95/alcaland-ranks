import { useEntityRows } from '@/features/views/hooks/useEntityRows.ts';
import { parseRiotId, riotIdKey } from '@/games/lol/model/riot-id.ts';
import { verifyRiotId } from '@/games/lol/api/lol-entity-api.ts';

export const useRiotIdRows = () =>
  useEntityRows<{ riotId: string }>({
    emptyFields: () => ({ riotId: '' }),
    keyOf: ({ riotId }) => {
      const parsed = parseRiotId(riotId);
      return parsed && riotIdKey(parsed);
    },
    isBlank: ({ riotId }) => !riotId.trim(),
    verify: ({ riotId }) => verifyRiotId(parseRiotId(riotId)!),
    growsOnVerify: true,
  });
