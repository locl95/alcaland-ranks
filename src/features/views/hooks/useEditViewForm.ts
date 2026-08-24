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

// The ladder renders saved and unsaved characters alike and reads score === null
// as "syncing", so a character with no profile yet is padded out on the way back.
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

  const setName = (value: string) => {
    setDuplicateName(null);
    setNewName(value);
  };

  const setRealm = (value: string) => {
    setDuplicateName(null);
    setNewRealm(value);
  };

  const setRegion = (value: string) => {
    setDuplicateName(null);
    setNewRegion(value);
  };

  const deleteCharacter = (id: number) => {
    setEditingCharacters((prev) => prev.filter((c) => c.id !== id));
    // Drop the status with it — otherwise a verification still in flight for a
    // removed character lands back in state under an id nothing renders.
    setStatuses(({ [id]: _removed, ...rest }) => rest);
  };

  const addCharacter = async () => {
    const name = newName.trim();
    if (!name || !newRealm) return;

    const character: EditableCharacter = {
      id: nextTempId(),
      name,
      realm: newRealm,
      region: newRegion,
      profile: null,
    };

    const key = characterKey(character);
    if (editingCharacters.some((c) => characterKey(c) === key)) {
      setDuplicateName(name);
      return;
    }

    setEditingCharacters((prev) => [...prev, character]);
    setStatuses((prev) => ({ ...prev, [character.id]: 'checking' }));
    setDuplicateName(null);
    setNewName('');
    setNewRealm('');
    setNewRegion('eu');

    const result = await verifyEntity(character);
    setStatuses((prev) => ({ ...prev, [character.id]: result }));
  };

  const visibleStatuses = editingCharacters.map((c) => statuses[c.id]);
  const notFound = editingCharacters.filter((c) => statuses[c.id] === 'invalid');
  const canSave = !newName.trim() && !visibleStatuses.includes('checking') && notFound.length === 0;

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
      formatDuplicateMessage(duplicateName) ?? formatNotFoundMessage(notFound.map((c) => c.name)),
    canSave,
    addCharacter,
    deleteCharacter,
    save: () => onSave(editingCharacters.map(toProfile)),
  };
}
