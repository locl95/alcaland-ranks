import { FormEvent, useState } from 'react';
import { View } from '@/features/views/model/view.ts';
import { userRequest } from '@/shared/api/httpClient.ts';
import { entityKey, verifyEntity } from '@/features/views/api/entityApi.ts';
import { CheckStatus } from '@/features/views/components/shared/verification-badge.tsx';
import { formatDuplicateMessage, formatNotFoundMessage } from '@/features/views/utils.ts';

type RowStatus = 'draft' | CheckStatus;

export interface CharacterRow {
  id: string;
  name: string;
  realm: string;
  region: string;
  status: RowStatus;
}

const isSubmittable = (c: CharacterRow) => c.status === 'valid' || c.status === 'unverified';

const isCommitted = (c: CharacterRow) => c.status !== 'draft';

const emptyRow = (): CharacterRow => ({
  id: crypto.randomUUID(),
  name: '',
  realm: '',
  region: 'eu',
  status: 'draft',
});

export function useCreateViewForm(onClose: () => void, onCreateView: (view: View) => void) {
  const [name, setName] = useState('');
  const [characters, setCharacters] = useState<CharacterRow[]>(() => [emptyRow()]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [duplicateName, setDuplicateName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateCharacter = (id: string, field: string, value: string) => {
    setDuplicateName(null);
    setCharacters((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value, status: 'draft' } : c)),
    );
  };

  const addCharacter = async (id: string) => {
    const row = characters.find((c) => c.id === id);
    if (!row?.name.trim() || !row.realm) return;

    const entity = { name: row.name.trim(), region: row.region, realm: row.realm };
    const key = entityKey(entity);

    if (characters.some((c) => c.id !== id && isCommitted(c) && entityKey(c) === key)) {
      setDuplicateName(entity.name);
      return;
    }
    setDuplicateName(null);

    const isLastRow = characters[characters.length - 1].id === id;
    setCharacters((prev) => {
      const updated = prev.map((c) => (c.id === id ? { ...c, status: 'checking' as const } : c));
      return isLastRow ? [...updated, emptyRow()] : updated;
    });

    const result = await verifyEntity(entity);

    setCharacters((prev) =>
      prev.map((c) =>
        c.id === id && c.status === 'checking' && entityKey(c) === key
          ? { ...c, status: result }
          : c,
      ),
    );
  };

  const removeCharacter = (id: string) => {
    setDuplicateName(null);
    setCharacters((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      return updated.length ? updated : [emptyRow()];
    });
  };

  const notFound = characters.filter((c) => c.status === 'invalid');
  const errorMessage =
    formatDuplicateMessage(duplicateName) ??
    formatNotFoundMessage(notFound.map((c) => c.name.trim())) ??
    submitError;

  const hasUnverifiedInput = characters.some((c) => c.status === 'draft' && !!c.name.trim());
  const canSubmit =
    !isSubmitting &&
    !!name.trim() &&
    !hasUnverifiedInput &&
    notFound.length === 0 &&
    !characters.some((c) => c.status === 'checking') &&
    characters.some(isSubmittable);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitError(null);
    setIsSubmitting(true);

    const addedCharacters = characters.filter(isSubmittable);

    try {
      const { id: operationId } = await userRequest<{ id: string }>('POST', '/views', {
        name,
        entities: addedCharacters.map((c) => ({
          name: c.name.trim(),
          region: c.region,
          realm: c.realm,
          type: 'com.kos.entities.domain.WowEntityRequest',
        })),
        published: true,
        featured: false,
        game: 'WOW',
      });

      onCreateView({
        operationId,
        simpleView: {
          id: operationId,
          name,
          owner: '',
          published: true,
          entitiesIds: addedCharacters.map((_, i) => i),
          game: 'WOW',
          featured: false,
          extraArguments: null,
        },
        status: 'pending',
      });

      onClose();
    } catch {
      setSubmitError('Failed to create ladder. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    name,
    setName,
    characters,
    canSubmit,
    errorMessage,
    isSubmitting,
    updateCharacter,
    addCharacter,
    removeCharacter,
    handleSubmit,
  };
}
