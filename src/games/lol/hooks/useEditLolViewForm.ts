import { useEditEntitiesForm } from '@/features/views/hooks/useEditEntitiesForm.ts';
import { NOT_FOUND_HINT, parseRiotId, RiotId, riotIdKey } from '@/games/lol/model/riot-id.ts';
import { useRiotIdRows } from '@/games/lol/hooks/useRiotIdRows.ts';

export function useEditLolViewForm(
  members: RiotId[],
  onSave: (players: RiotId[]) => Promise<string | null>,
  onClose: () => void,
) {
  const entityRows = useRiotIdRows();
  const form = useEditEntitiesForm(members, onSave, onClose, {
    entityRows,
    key: riotIdKey,
    // Added rows were verified, so they always parse.
    toEntity: ({ riotId }) => parseRiotId(riotId)!,
    formatEntity: ({ name, tag }) => `${name}#${tag}`,
    formatRow: ({ riotId }) => riotId.trim(),
    notFoundHint: NOT_FOUND_HINT,
  });

  return {
    ...form,
    rows: entityRows.rows,
    updateRow: (id: string, riotId: string) => entityRows.updateRow(id, { riotId }),
    verifyRow: entityRows.verifyRow,
    removeRow: entityRows.removeRow,
  };
}
