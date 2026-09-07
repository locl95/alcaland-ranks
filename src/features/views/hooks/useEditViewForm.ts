import { useState } from 'react';
import { RaiderioProfile } from '@/features/views/api/raiderio.ts';
import { entityKey, verifyEntity } from '@/features/views/api/entityApi.ts';
import { CheckStatus } from '@/features/views/components/shared/verification-badge.tsx';
import {
  formatDuplicateMessage,
  formatNotFoundMessage,
  toRealmSlug,
} from '@/features/views/utils.ts';

export interface EditableCharacter {
  id: number;
  name: string;
  realm: string;
  region: string;
  profile: RaiderioProfile | null;
}

type StatusById = Record<number, CheckStatus>;

let lastTempId = 0;
const nextTempId = () => --lastTempId;

const characterKey = (c: { name: string; realm: string; region: string }) =>
  entityKey({ name: c.name, region: c.region, realm: toRealmSlug(c.realm, c.region) });

const fromProfile = (profile: RaiderioProfile): EditableCharacter => ({
  id: profile.id,
  name: profile.name,
  realm: profile.realm,
  region: profile.region,
  profile,
});

const toProfile = ({ id, name, realm, region, profile }: EditableCharacter): RaiderioProfile =>
  profile ?? {
    id,
    name,
    realm,
    region,
    score: null,
    class: '',
    spec: '',
    quantile: 0,
    mythicPlusBestRuns: [],
    mythicPlusRanks: {
      overall: { world: 0, region: 0, realm: 0 },
      class: { world: 0, region: 0, realm: 0 },
      specs: [],
    },
    mythicPlusRecentRuns: [],
  };

export function useEditViewForm(
  characters: RaiderioProfile[],
  onSave: (c: RaiderioProfile[]) => void,
) {
  const [editingCharacters, setEditingCharacters] = useState<EditableCharacter[]>(() =>
    characters.filter((c) => c.score !== null).map(fromProfile),
  );
  const [newName, setNewName] = useState('');
  const [newRealm, setNewRealm] = useState('');
  const [newRegion, setNewRegion] = useState('eu');
  const [statuses, setStatuses] = useState<StatusById>({});
  const [duplicateName, setDuplicateName] = useState<string | null>(null);
  const [notFoundName, setNotFoundName] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const clearFeedback = () => {
    setDuplicateName(null);
    setNotFoundName(null);
  };

  const setName = (value: string) => {
    clearFeedback();
    setNewName(value);
  };

  const setRealm = (value: string) => {
    clearFeedback();
    setNewRealm(value);
  };

  const setRegion = (value: string) => {
    clearFeedback();
    setNewRegion(value);
  };

  const deleteCharacter = (id: number) => {
    setEditingCharacters((prev) => prev.filter((c) => c.id !== id));
    setStatuses(({ [id]: _removed, ...rest }) => rest);
  };

  const addCharacter = async () => {
    const name = newName.trim();
    if (!name || !newRealm || isChecking) return;

    const entity = { name, region: newRegion, realm: newRealm };
    const key = characterKey(entity);
    if (editingCharacters.some((c) => characterKey(c) === key)) {
      setDuplicateName(name);
      return;
    }

    clearFeedback();
    setIsChecking(true);
    const result = await verifyEntity(entity);
    setIsChecking(false);

    // A rejected character never enters the list. Unlike the create form, a row here
    // cannot be edited once added — only deleted — so keeping it would be pure friction.
    // The typed values stay put instead, ready to be corrected in place.
    if (result === 'invalid') {
      setNotFoundName(name);
      return;
    }

    const character: EditableCharacter = { id: nextTempId(), ...entity, profile: null };

    // Prepended, not appended: the list is paginated, and the dialog resets to page one
    // on add so the new row — and its verification badge — is always the one you see.
    setEditingCharacters((prev) => [character, ...prev]);
    setStatuses((prev) => ({ ...prev, [character.id]: result }));
    setNewName('');
    setNewRealm('');
    setNewRegion('eu');
  };

  // No row in the list can be invalid or checking any more, so saving only waits on the
  // add row: a name still typed in it, or a check still in flight.
  const canSave = !newName.trim() && !isChecking;

  return {
    editingCharacters,
    statuses,
    newName,
    newRealm,
    newRegion,
    setName,
    setRealm,
    setRegion,
    errorMessage:
      formatDuplicateMessage(duplicateName) ??
      formatNotFoundMessage(notFoundName ? [notFoundName] : []),
    isChecking,
    canSave,
    addCharacter,
    deleteCharacter,
    save: () => onSave(editingCharacters.map(toProfile)),
  };
}
