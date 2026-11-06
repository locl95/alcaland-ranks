import { FormEvent } from 'react';
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CharacterRef } from '@/games/wow-forever/model/character.ts';
import { useEditForeverViewForm } from './useEditForeverViewForm.ts';

const mockServiceRequest = vi.fn();

vi.mock('@/shared/api/httpClient.ts', () => ({
  serviceRequest: (...args: unknown[]) => mockServiceRequest(...args),
}));

const MEMBERS = [
  { name: 'Siempre', surname: 'Tarde', region: 'eu' },
  { name: 'Daxan', surname: 'Windfury', region: 'eu' },
];
const onSave = vi.fn();
const onClose = vi.fn();
const submitEvent = { preventDefault: vi.fn() } as unknown as FormEvent;

const renderForm = () => renderHook(() => useEditForeverViewForm(MEMBERS, onSave, onClose));

async function addCharacter(
  result: { current: ReturnType<typeof useEditForeverViewForm> },
  character: Partial<CharacterRef>,
) {
  const rowId = result.current.rows[result.current.rows.length - 1].id;
  act(() => result.current.updateRow(rowId, character));
  await act(async () => result.current.verifyRow(rowId));
}

describe('useEditForeverViewForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockServiceRequest.mockResolvedValue({ exist: [], nonExisting: [], unchecked: [] });
    onSave.mockResolvedValue(null);
  });

  it('saves the remaining characters plus the added ones', async () => {
    const { result } = renderForm();
    act(() => result.current.removeMember(MEMBERS[0]));
    await addCharacter(result, { name: 'Brakk', surname: 'Ironhide', region: 'us' });

    await act(() => result.current.handleSubmit(submitEvent));

    expect(onSave).toHaveBeenCalledWith([
      MEMBERS[1],
      { name: 'Brakk', surname: 'Ironhide', region: 'us' },
    ]);
    expect(onClose).toHaveBeenCalled();
  });

  it('blocks adding a character already in the ladder', async () => {
    const { result } = renderForm();
    await addCharacter(result, { name: 'daxan', surname: 'windfury' });

    expect(result.current.errorMessage).toBe('daxan windfury is already in this ladder.');
    expect(result.current.canSave).toBe(false);
  });

  it('blocks saving while a typed character has not been added', () => {
    const { result } = renderForm();
    act(() => result.current.removeMember(MEMBERS[0]));
    act(() => result.current.updateRow(result.current.rows[0].id, { name: 'Brakk' }));

    expect(result.current.canSave).toBe(false);
  });

  it('keeps the dialog open with the error when saving fails', async () => {
    onSave.mockResolvedValue('This ladder has more characters than allowed.');
    const { result } = renderForm();
    act(() => result.current.removeMember(MEMBERS[0]));

    await act(() => result.current.handleSubmit(submitEvent));

    expect(result.current.errorMessage).toBe('This ladder has more characters than allowed.');
    expect(onClose).not.toHaveBeenCalled();
  });
});
