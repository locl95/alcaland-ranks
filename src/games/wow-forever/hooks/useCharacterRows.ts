import { useEntityRows } from '@/features/views/hooks/useEntityRows.ts';
import { CharacterRef, characterKey } from '@/games/wow-forever/model/character.ts';
import { verifyCharacter } from '@/games/wow-forever/api/forever-entity-api.ts';

const isComplete = ({ name, surname }: CharacterRef) => !!name.trim() && !!surname.trim();

export const useCharacterRows = () =>
  useEntityRows<CharacterRef>({
    emptyFields: () => ({ name: '', surname: '', region: 'eu' }),
    keyOf: (character) => (isComplete(character) ? characterKey(character) : null),
    isBlank: ({ name, surname }) => !name.trim() && !surname.trim(),
    verify: verifyCharacter,
    growsOnVerify: true,
  });
