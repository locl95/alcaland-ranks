import { useEntityRows } from '@/features/views/hooks/useEntityRows.ts';
import {
  CharacterRef,
  characterKey,
  isCompleteCharacter,
} from '@/games/wow/forever/model/character.ts';
import { verifyCharacter, verifyGuild } from '@/games/wow/forever/api/forever-entity-api.ts';

/** A guild row is a single one, named by name + region; its surname stays empty. */
const guildKey = ({ name, region }: CharacterRef): string | null =>
  name.trim() ? `${name.trim().toLowerCase()}|${region.toLowerCase()}` : null;

export const useCharacterRows = (isGuild = false) =>
  useEntityRows<CharacterRef>({
    emptyFields: () => ({ name: '', surname: '', region: 'eu' }),
    keyOf: (row) => (isGuild ? guildKey(row) : isCompleteCharacter(row) ? characterKey(row) : null),
    isBlank: ({ name, surname }) => !name.trim() && !surname.trim(),
    verify: isGuild ? verifyGuild : verifyCharacter,
    growsOnVerify: !isGuild,
  });
