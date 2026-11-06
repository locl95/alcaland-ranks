import { useEntityRows } from '@/features/views/hooks/useEntityRows.ts';
import {
  CharacterRef,
  characterKey,
  isCompleteCharacter,
} from '@/games/wow-forever/model/character.ts';
import { verifyCharacter } from '@/games/wow-forever/api/forever-entity-api.ts';

export const useCharacterRows = () =>
  useEntityRows<CharacterRef>({
    emptyFields: () => ({ name: '', surname: '', region: 'eu' }),
    keyOf: (character) => (isCompleteCharacter(character) ? characterKey(character) : null),
    isBlank: ({ name, surname }) => !name.trim() && !surname.trim(),
    verify: verifyCharacter,
    growsOnVerify: true,
  });
