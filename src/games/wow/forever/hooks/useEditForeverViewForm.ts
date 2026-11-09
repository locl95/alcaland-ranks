import { useEditEntitiesForm } from '@/features/views/hooks/useEditEntitiesForm.ts';
import {
  CharacterRef,
  characterKey,
  formatCharacterName,
  NOT_FOUND_HINT,
  toCharacterRef,
} from '@/games/wow/forever/model/character.ts';
import { useCharacterRows } from '@/games/wow/forever/hooks/useCharacterRows.ts';

export function useEditForeverViewForm(
  members: CharacterRef[],
  onSave: (characters: CharacterRef[]) => Promise<string | null>,
  onClose: () => void,
) {
  const entityRows = useCharacterRows();
  const form = useEditEntitiesForm(members, onSave, onClose, {
    entityRows,
    key: characterKey,
    toEntity: toCharacterRef,
    formatEntity: formatCharacterName,
    formatRow: formatCharacterName,
    notFoundHint: NOT_FOUND_HINT,
  });

  return {
    ...form,
    rows: entityRows.rows,
    updateRow: entityRows.updateRow,
    verifyRow: entityRows.verifyRow,
    removeRow: entityRows.removeRow,
  };
}
