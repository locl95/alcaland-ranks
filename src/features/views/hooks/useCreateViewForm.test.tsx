import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FormEvent } from 'react';
import { useCreateViewForm } from './useCreateViewForm.ts';

const mockUserRequest = vi.fn();
const mockCheckEntitiesExist = vi.fn();

vi.mock('@/shared/api/httpClient.ts', () => ({
  userRequest: (...args: unknown[]) => mockUserRequest(...args),
  serviceRequest: (...args: unknown[]) => mockCheckEntitiesExist(...args),
}));

const onClose = vi.fn();
const onCreateView = vi.fn();

const renderForm = () => renderHook(() => useCreateViewForm(onClose, onCreateView));

const makeSubmitEvent = () => ({ preventDefault: vi.fn() }) as unknown as FormEvent;

async function addRow(
  result: { current: ReturnType<typeof useCreateViewForm> },
  name: string,
  realm = 'tarren-mill',
) {
  const rowId = result.current.characters[result.current.characters.length - 1].id;
  act(() => {
    result.current.updateCharacter(rowId, 'name', name);
    result.current.updateCharacter(rowId, 'realm', realm);
  });
  await act(async () => result.current.addCharacter(rowId));
  return rowId;
}

describe('useCreateViewForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUserRequest.mockResolvedValue({ id: 'op-123' });
    mockCheckEntitiesExist.mockResolvedValue({ exist: [], nonExisting: [], unchecked: [] });
  });

  describe('addCharacter', () => {
    it('marks the row valid and appends a new empty row', async () => {
      const { result } = renderForm();
      await addRow(result, 'Arthas');

      expect(result.current.characters).toHaveLength(2);
      expect(result.current.characters[0].status).toBe('valid');
      expect(result.current.characters[1].status).toBe('draft');
      expect(result.current.characters[1].name).toBe('');
    });

    it('verifies the trimmed name against the backend', async () => {
      const { result } = renderForm();
      await addRow(result, '  Arthas  ');

      expect(mockCheckEntitiesExist).toHaveBeenCalledWith('POST', '/entities/exists', {
        entities: [
          {
            type: 'com.kos.entities.domain.WowEntityRequest',
            name: 'Arthas',
            region: 'eu',
            realm: 'tarren-mill',
          },
        ],
        game: 'WOW',
      });
    });

    it('marks the row invalid when the character does not exist', async () => {
      mockCheckEntitiesExist.mockResolvedValue({
        exist: [],
        nonExisting: [{ name: 'Fake', region: 'eu', realm: 'tarren-mill' }],
        unchecked: [],
      });
      const { result } = renderForm();
      await addRow(result, 'Fake');

      expect(result.current.characters[0].status).toBe('invalid');
      expect(result.current.errorMessage).toBe(
        'Fake was not found. Check the name, realm and region.',
      );
    });

    it('matches the response case-insensitively', async () => {
      mockCheckEntitiesExist.mockResolvedValue({
        exist: [],
        nonExisting: [{ name: 'FAKE', region: 'eu', realm: 'tarren-mill' }],
        unchecked: [],
      });
      const { result } = renderForm();
      await addRow(result, 'fake');

      expect(result.current.characters[0].status).toBe('invalid');
    });

    it('marks the row unverified when the backend could not check it, never valid', async () => {
      mockCheckEntitiesExist.mockResolvedValue({
        exist: [],
        nonExisting: [],
        unchecked: [{ name: 'Arthas', region: 'eu', realm: 'tarren-mill' }],
      });
      const { result } = renderForm();
      await addRow(result, 'Arthas');

      expect(result.current.characters[0].status).toBe('unverified');
      expect(result.current.errorMessage).toBeNull();
    });

    it('marks the row unverified when the lookup itself fails, never valid', async () => {
      mockCheckEntitiesExist.mockRejectedValue(new Error('Network error'));
      const { result } = renderForm();
      await addRow(result, 'Arthas');

      expect(result.current.characters[0].status).toBe('unverified');
      expect(result.current.errorMessage).toBeNull();
    });

    it('does not apply a stale result to a row edited while checking', async () => {
      let resolveCheck: (value: unknown) => void = () => {};
      mockCheckEntitiesExist.mockReturnValue(
        new Promise((resolve) => {
          resolveCheck = resolve;
        }),
      );
      const { result } = renderForm();

      const rowId = result.current.characters[0].id;
      act(() => {
        result.current.updateCharacter(rowId, 'name', 'Arthas');
        result.current.updateCharacter(rowId, 'realm', 'tarren-mill');
      });
      act(() => {
        result.current.addCharacter(rowId);
      });
      expect(result.current.characters[0].status).toBe('checking');

      act(() => result.current.updateCharacter(rowId, 'name', 'Sylvanas'));
      expect(result.current.characters[0].status).toBe('draft');

      await act(async () => {
        resolveCheck({ exist: [], nonExisting: [], unchecked: [] });
      });

      expect(result.current.characters[0].name).toBe('Sylvanas');
      expect(result.current.characters[0].status).toBe('draft');
    });

    it('rejects a character that is already in the ladder', async () => {
      const { result } = renderForm();
      await addRow(result, 'Arthas');
      mockCheckEntitiesExist.mockClear();

      const dupId = result.current.characters[1].id;
      act(() => {
        result.current.updateCharacter(dupId, 'name', 'arthas');
        result.current.updateCharacter(dupId, 'realm', 'tarren-mill');
      });
      await act(async () => result.current.addCharacter(dupId));

      expect(result.current.errorMessage).toBe('arthas is already in this ladder.');
      expect(result.current.characters.filter((c) => c.status === 'valid')).toHaveLength(1);
      expect(mockCheckEntitiesExist).not.toHaveBeenCalled();
    });

    it('allows the same name on a different realm', async () => {
      const { result } = renderForm();
      await addRow(result, 'Arthas', 'tarren-mill');
      await addRow(result, 'Arthas', 'silvermoon');

      expect(result.current.errorMessage).toBeNull();
      expect(result.current.characters.filter((c) => c.status === 'valid')).toHaveLength(2);
    });

    it('clears the duplicate message when the row is edited', async () => {
      const { result } = renderForm();
      await addRow(result, 'Arthas');
      const dupId = result.current.characters[1].id;
      act(() => {
        result.current.updateCharacter(dupId, 'name', 'Arthas');
        result.current.updateCharacter(dupId, 'realm', 'tarren-mill');
      });
      await act(async () => result.current.addCharacter(dupId));
      expect(result.current.errorMessage).not.toBeNull();

      act(() => result.current.updateCharacter(dupId, 'name', 'Sylvanas'));
      expect(result.current.errorMessage).toBeNull();
    });

    it('opens the next row immediately so another character can be typed while checking', async () => {
      let resolveCheck: (value: unknown) => void = () => {};
      mockCheckEntitiesExist.mockReturnValue(
        new Promise((resolve) => {
          resolveCheck = resolve;
        }),
      );
      const { result } = renderForm();

      const rowId = result.current.characters[0].id;
      act(() => {
        result.current.updateCharacter(rowId, 'name', 'Arthas');
        result.current.updateCharacter(rowId, 'realm', 'tarren-mill');
      });
      act(() => {
        result.current.addCharacter(rowId);
      });

      expect(result.current.characters[0].status).toBe('checking');
      expect(result.current.characters).toHaveLength(2);
      expect(result.current.characters[1].status).toBe('draft');

      await act(async () => {
        resolveCheck({ exist: [], nonExisting: [], unchecked: [] });
      });
      expect(result.current.characters[0].status).toBe('valid');
    });

    it('resolves concurrent verifications onto their own rows', async () => {
      const resolvers: ((value: unknown) => void)[] = [];
      mockCheckEntitiesExist.mockImplementation(
        () => new Promise((resolve) => resolvers.push(resolve)),
      );
      const { result } = renderForm();

      const firstId = result.current.characters[0].id;
      act(() => {
        result.current.updateCharacter(firstId, 'name', 'Arthas');
        result.current.updateCharacter(firstId, 'realm', 'tarren-mill');
      });
      act(() => {
        result.current.addCharacter(firstId);
      });

      const secondId = result.current.characters[1].id;
      act(() => {
        result.current.updateCharacter(secondId, 'name', 'Fake');
        result.current.updateCharacter(secondId, 'realm', 'tarren-mill');
      });
      act(() => {
        result.current.addCharacter(secondId);
      });

      await act(async () => {
        resolvers[1]({
          exist: [],
          nonExisting: [{ name: 'Fake', region: 'eu', realm: 'tarren-mill' }],
          unchecked: [],
        });
      });
      await act(async () => {
        resolvers[0]({ exist: [], nonExisting: [], unchecked: [] });
      });

      expect(result.current.characters[0].status).toBe('valid');
      expect(result.current.characters[1].status).toBe('invalid');
    });

    it('resets a verified row to draft when it is edited', async () => {
      const { result } = renderForm();
      const rowId = await addRow(result, 'Arthas');
      expect(result.current.characters[0].status).toBe('valid');

      act(() => result.current.updateCharacter(rowId, 'name', 'Arthaz'));
      expect(result.current.characters[0].status).toBe('draft');
    });
  });

  describe('removeCharacter', () => {
    it('removes the row with the given id', async () => {
      const { result } = renderForm();
      const rowId = await addRow(result, 'Arthas');
      expect(result.current.characters).toHaveLength(2);

      act(() => result.current.removeCharacter(rowId));
      expect(result.current.characters).toHaveLength(1);
    });

    it('keeps one empty row if the last character is removed', () => {
      const { result } = renderForm();
      act(() => result.current.removeCharacter(result.current.characters[0].id));
      expect(result.current.characters).toHaveLength(1);
      expect(result.current.characters[0].status).toBe('draft');
      expect(result.current.characters[0].name).toBe('');
    });

    it('clears the not-found message when the invalid row is removed', async () => {
      mockCheckEntitiesExist.mockResolvedValue({
        exist: [],
        nonExisting: [{ name: 'Fake', region: 'eu', realm: 'tarren-mill' }],
        unchecked: [],
      });
      const { result } = renderForm();
      const rowId = await addRow(result, 'Fake');
      expect(result.current.errorMessage).not.toBeNull();

      act(() => result.current.removeCharacter(rowId));
      expect(result.current.errorMessage).toBeNull();
    });
  });

  describe('canSubmit', () => {
    it('is false when name is empty even with a verified character', async () => {
      const { result } = renderForm();
      await addRow(result, 'Arthas');
      expect(result.current.canSubmit).toBe(false);
    });

    it('is false when name is set but no character was added', () => {
      const { result } = renderForm();
      act(() => result.current.setName('My Ladder'));
      expect(result.current.canSubmit).toBe(false);
    });

    it('is true when name is set and a character is verified', async () => {
      const { result } = renderForm();
      act(() => result.current.setName('My Ladder'));
      await addRow(result, 'Arthas');
      expect(result.current.canSubmit).toBe(true);
    });

    it('is false while a verification is in flight', async () => {
      let resolveCheck: (value: unknown) => void = () => {};
      mockCheckEntitiesExist.mockReturnValue(
        new Promise((resolve) => {
          resolveCheck = resolve;
        }),
      );
      const { result } = renderForm();
      act(() => result.current.setName('My Ladder'));

      const rowId = result.current.characters[0].id;
      act(() => {
        result.current.updateCharacter(rowId, 'name', 'Arthas');
        result.current.updateCharacter(rowId, 'realm', 'tarren-mill');
      });
      act(() => {
        result.current.addCharacter(rowId);
      });

      expect(result.current.canSubmit).toBe(false);

      await act(async () => {
        resolveCheck({ exist: [], nonExisting: [], unchecked: [] });
      });
      expect(result.current.canSubmit).toBe(true);
    });

    it('is false while any character is invalid', async () => {
      const { result } = renderForm();
      act(() => result.current.setName('My Ladder'));
      await addRow(result, 'Arthas');
      mockCheckEntitiesExist.mockResolvedValue({
        exist: [],
        nonExisting: [{ name: 'Fake', region: 'eu', realm: 'tarren-mill' }],
        unchecked: [],
      });
      const badId = await addRow(result, 'Fake');

      expect(result.current.canSubmit).toBe(false);

      act(() => result.current.removeCharacter(badId));
      expect(result.current.canSubmit).toBe(true);
    });

    it('is false while the trailing row has an unverified name typed in', async () => {
      const { result } = renderForm();
      act(() => result.current.setName('My Ladder'));
      await addRow(result, 'Arthas');
      expect(result.current.canSubmit).toBe(true);

      const trailingId = result.current.characters[1].id;
      act(() => result.current.updateCharacter(trailingId, 'name', 'Sylvanas'));
      expect(result.current.canSubmit).toBe(false);

      act(() => result.current.updateCharacter(trailingId, 'name', ''));
      expect(result.current.canSubmit).toBe(true);
    });
  });

  describe('reset on close', () => {
    it('starts empty again when the dialog is reopened', async () => {
      const { result, unmount } = renderForm();

      act(() => result.current.setName('My Ladder'));
      await addRow(result, 'Arthas');

      expect(result.current.name).toBe('My Ladder');
      expect(result.current.characters).toHaveLength(2);

      // The parent mounts the dialog only while open, so reopening is a fresh mount.
      unmount();
      const reopened = renderForm();

      expect(reopened.result.current.name).toBe('');
      expect(reopened.result.current.characters).toHaveLength(1);
      expect(reopened.result.current.characters[0].status).toBe('draft');
    });
  });

  describe('handleSubmit', () => {
    it('calls onCreateView with a pending view and calls onClose on success', async () => {
      const { result } = renderForm();
      act(() => result.current.setName('My Ladder'));
      await addRow(result, 'Arthas');

      await act(async () => result.current.handleSubmit(makeSubmitEvent()));

      expect(onCreateView).toHaveBeenCalledOnce();
      expect(onCreateView).toHaveBeenCalledWith(
        expect.objectContaining({ operationId: 'op-123', status: 'pending' }),
      );
      expect(onClose).toHaveBeenCalledOnce();
      expect(result.current.errorMessage).toBeNull();
    });

    it('sets error and does not call onClose when the POST fails', async () => {
      mockUserRequest.mockRejectedValue(new Error('Network error'));
      const { result } = renderForm();
      act(() => result.current.setName('My Ladder'));
      await addRow(result, 'Arthas');

      await act(async () => result.current.handleSubmit(makeSubmitEvent()));

      expect(result.current.errorMessage).toBe('Failed to create ladder. Please try again.');
      expect(onClose).not.toHaveBeenCalled();
      expect(onCreateView).not.toHaveBeenCalled();
    });

    it('refuses to submit while the trailing row holds an unadded character', async () => {
      const { result } = renderForm();
      act(() => result.current.setName('My Ladder'));
      await addRow(result, 'Arthas');

      const trailingId = result.current.characters[1].id;
      act(() => {
        result.current.updateCharacter(trailingId, 'name', 'Sylvanas');
        result.current.updateCharacter(trailingId, 'realm', 'silvermoon');
      });

      await act(async () => result.current.handleSubmit(makeSubmitEvent()));
      expect(mockUserRequest).not.toHaveBeenCalled();

      act(() => result.current.updateCharacter(trailingId, 'name', ''));
      await act(async () => result.current.handleSubmit(makeSubmitEvent()));

      expect(mockUserRequest).toHaveBeenCalledWith(
        'POST',
        '/views',
        expect.objectContaining({
          entities: [
            {
              name: 'Arthas',
              region: 'eu',
              realm: 'tarren-mill',
              type: 'com.kos.entities.domain.WowEntityRequest',
            },
          ],
        }),
      );
    });

    it('submits characters whose lookup failed, marked unverified', async () => {
      mockCheckEntitiesExist.mockRejectedValue(new Error('Network error'));
      const { result } = renderForm();
      act(() => result.current.setName('My Ladder'));
      await addRow(result, 'Arthas');

      expect(result.current.canSubmit).toBe(true);
      await act(async () => result.current.handleSubmit(makeSubmitEvent()));

      expect(mockUserRequest).toHaveBeenCalledWith(
        'POST',
        '/views',
        expect.objectContaining({
          entities: [expect.objectContaining({ name: 'Arthas' })],
        }),
      );
    });

    it('does not re-verify rows that were already added', async () => {
      const { result } = renderForm();
      act(() => result.current.setName('My Ladder'));
      await addRow(result, 'Arthas');
      mockCheckEntitiesExist.mockClear();

      await act(async () => result.current.handleSubmit(makeSubmitEvent()));

      expect(mockCheckEntitiesExist).not.toHaveBeenCalled();
      expect(mockUserRequest).toHaveBeenCalledOnce();
    });
  });
});
