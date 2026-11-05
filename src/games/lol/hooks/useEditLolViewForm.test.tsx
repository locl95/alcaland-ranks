import React, { FormEvent } from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEditLolViewForm } from './useEditLolViewForm.ts';

const mockUserRequest = vi.fn();
const mockServiceRequest = vi.fn();

vi.mock('@/shared/api/httpClient.ts', () => ({
  userRequest: (...args: unknown[]) => mockUserRequest(...args),
  serviceRequest: (...args: unknown[]) => mockServiceRequest(...args),
}));

const VIEW_ID = '11111111-1111-1111-1111-111111111111';
const onSave = vi.fn();
const onClose = vi.fn();
const submitEvent = { preventDefault: vi.fn() } as unknown as FormEvent;

const renderForm = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  queryClient.setQueryData(['view', VIEW_ID], { owner: 'testuser' });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return renderHook(() => useEditLolViewForm(VIEW_ID, onSave, onClose), { wrapper });
};

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
    mockUserRequest.mockResolvedValue({
      owner: 'testuser',
      entities: [
        { id: 1, name: 'Faker', tag: 'KR1', puuid: 'p1', alias: null },
        { id: 2, name: 'Caps', tag: 'EUW', puuid: 'p2', alias: null },
      ],
    });
    mockServiceRequest.mockResolvedValue({ exist: [], nonExisting: [], unchecked: [] });
    onSave.mockResolvedValue(null);
  });

  it('lists the players from the view entities, refetched even when the landing cached the view', async () => {
    const { result } = renderForm();
    expect(result.current.members).toBeNull();

    await waitFor(() =>
      expect(result.current.members).toEqual([
        { name: 'Faker', tag: 'KR1' },
        { name: 'Caps', tag: 'EUW' },
      ]),
    );
    expect(mockUserRequest).toHaveBeenCalledWith('GET', `/views/${VIEW_ID}`);
  });

  it('cannot save until something changed', async () => {
    const { result } = renderForm();
    await waitFor(() => expect(result.current.members).not.toBeNull());
    expect(result.current.canSave).toBe(false);
  });

  it('saves the remaining players plus the added ones, then closes', async () => {
    const { result } = renderForm();
    await waitFor(() => expect(result.current.members).not.toBeNull());

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
    await waitFor(() => expect(result.current.members).not.toBeNull());

    await addPlayer(result, 'faker#kr1');

    expect(result.current.errorMessage).toBe('faker#kr1 is already in this ladder.');
    expect(result.current.canSave).toBe(false);
  });

  it('lets you add back a player you just removed', async () => {
    const { result } = renderForm();
    await waitFor(() => expect(result.current.members).not.toBeNull());

    act(() => result.current.removeMember({ name: 'Caps', tag: 'EUW' }));
    await addPlayer(result, 'Caps#EUW');

    expect(result.current.errorMessage).toBeNull();
    expect(result.current.canSave).toBe(true);
  });

  it('keeps the dialog open and shows the error when saving fails', async () => {
    onSave.mockResolvedValue('This ladder has more players than allowed.');
    const { result } = renderForm();
    await waitFor(() => expect(result.current.members).not.toBeNull());

    await addPlayer(result, 'Chovy#KR2');
    await act(async () => result.current.handleSubmit(submitEvent));

    expect(result.current.errorMessage).toBe('This ladder has more players than allowed.');
    expect(onClose).not.toHaveBeenCalled();
  });
});
