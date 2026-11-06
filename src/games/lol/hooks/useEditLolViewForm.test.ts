import { FormEvent } from 'react';
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useEditLolViewForm } from './useEditLolViewForm.ts';

const mockServiceRequest = vi.fn();

vi.mock('@/shared/api/httpClient.ts', () => ({
  serviceRequest: (...args: unknown[]) => mockServiceRequest(...args),
}));

const MEMBERS = [
  { name: 'Faker', tag: 'KR1' },
  { name: 'Caps', tag: 'EUW' },
];
const onSave = vi.fn();
const onClose = vi.fn();
const submitEvent = { preventDefault: vi.fn() } as unknown as FormEvent;

const renderForm = () => renderHook(() => useEditLolViewForm(MEMBERS, onSave, onClose));

async function addPlayer(
  result: { current: ReturnType<typeof useEditLolViewForm> },
  riotId: string,
) {
  const rowId = result.current.rows[result.current.rows.length - 1].id;
  act(() => result.current.updateRow(rowId, riotId));
  await act(async () => result.current.verifyRow(rowId));
}

describe('useEditLolViewForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockServiceRequest.mockResolvedValue({ exist: [], nonExisting: [], unchecked: [] });
    onSave.mockResolvedValue(null);
  });

  it('lists the current players', () => {
    const { result } = renderForm();
    expect(result.current.members).toEqual(MEMBERS);
  });

  it('cannot save until something changed', () => {
    const { result } = renderForm();
    expect(result.current.canSave).toBe(false);
  });

  it('saves the remaining players plus the added ones, then closes', async () => {
    const { result } = renderForm();

    act(() => result.current.removeMember({ name: 'Caps', tag: 'EUW' }));
    await addPlayer(result, 'Chovy#KR2');
    await act(async () => result.current.handleSubmit(submitEvent));

    expect(onSave).toHaveBeenCalledWith([
      { name: 'Faker', tag: 'KR1' },
      { name: 'Chovy', tag: 'KR2' },
    ]);
    expect(onClose).toHaveBeenCalled();
  });

  it('flags a player that is already in the ladder and blocks saving', async () => {
    const { result } = renderForm();

    await addPlayer(result, 'faker#kr1');

    expect(result.current.errorMessage).toBe('faker#kr1 is already in this ladder.');
    expect(result.current.canSave).toBe(false);
  });

  it('lets you add back a player you just removed', async () => {
    const { result } = renderForm();

    act(() => result.current.removeMember({ name: 'Caps', tag: 'EUW' }));
    await addPlayer(result, 'Caps#EUW');

    expect(result.current.errorMessage).toBeNull();
    expect(result.current.canSave).toBe(true);
  });

  it('keeps the dialog open and shows the error when saving fails', async () => {
    onSave.mockResolvedValue('This ladder has more players than allowed.');
    const { result } = renderForm();

    await addPlayer(result, 'Chovy#KR2');
    await act(async () => result.current.handleSubmit(submitEvent));

    expect(result.current.errorMessage).toBe('This ladder has more players than allowed.');
    expect(onClose).not.toHaveBeenCalled();
  });
});
