import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WowViewDetail } from './wow-view-detail.tsx';
import { GameContext } from '@/shared/game/game.ts';
import type { SyncViewResult } from '@/features/views/hooks/useSyncView.ts';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useParams: () => ({ viewId: '11111111-1111-1111-1111-111111111111' }),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ state: null }),
}));

const mockUseViewDetail = vi.fn();
vi.mock('@/games/wow/hooks/useViewDetail.ts', () => ({
  useViewDetail: (...args: unknown[]) => mockUseViewDetail(...args),
}));

const mockUseSyncView = vi.fn();
vi.mock('@/features/views/hooks/useSyncView.ts', () => ({
  useSyncView: (...args: unknown[]) => mockUseSyncView(...args),
}));

vi.mock('./character-ladder/character-ladder.tsx', () => ({
  CharacterLadder: () => <div data-testid="character-ladder" />,
}));
vi.mock('./dungeon-grid/dungeon-grid.tsx', () => ({
  DungeonGrid: () => <div data-testid="dungeon-grid" />,
}));
vi.mock('./actions/edit-view.tsx', () => ({
  EditView: ({ onSave }: { onSave: (characters: unknown[]) => Promise<string | null> }) => (
    <div data-testid="edit-view">
      <button onClick={() => onSave([])}>Save</button>
    </div>
  ),
}));
vi.mock('./actions/sync-error-dialog.tsx', () => ({
  SyncErrorDialog: () => null,
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const defaultViewDetail = {
  profiles: [],
  cachedProfiles: [],
  viewName: 'Test View',
  season: null,
  initialized: true,
  isSyncing: false,
  syncError: null,
  canEdit: false,
  isViewIdValid: true,
  saveCharacters: vi.fn(),
  clearSyncError: vi.fn(),
};

const defaultSyncView: SyncViewResult = {
  isRunning: false,
  isDisabled: false,
  countdownLabel: null,
  statusMessage: null,
  lastSyncedAt: null,
  triggerSync: vi.fn(),
};

const renderView = (
  viewDetail: Partial<typeof defaultViewDetail> = {},
  syncView: Partial<SyncViewResult> = {},
) => {
  mockUseViewDetail.mockReturnValue({ ...defaultViewDetail, ...viewDetail });
  mockUseSyncView.mockReturnValue({ ...defaultSyncView, ...syncView });
  return render(
    <GameContext.Provider value="wow">
      <WowViewDetail />
    </GameContext.Provider>,
  );
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('WowViewDetail — sync button', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows "Syncing..." and is disabled while isRunning is true', () => {
    renderView({}, { isRunning: true, isDisabled: true });
    const btn = screen.getByRole('button', { name: /syncing/i });
    expect(btn).toBeDisabled();
  });

  it('is disabled when isSyncDisabled is true (cooldown active)', () => {
    renderView({}, { isDisabled: true, countdownLabel: '1m 30s' });
    expect(screen.getByRole('button', { name: /1m 30s/i })).toBeDisabled();
  });

  it('is disabled when an edit operation (isSyncing) is in progress', () => {
    renderView({ isSyncing: true });
    expect(screen.getByRole('button', { name: /sync/i })).toBeDisabled();
  });

  it('is disabled when the edit panel is open', async () => {
    renderView({ canEdit: true });
    await userEvent.click(screen.getByRole('button', { name: /edit/i }));
    expect(screen.getByRole('button', { name: /sync/i })).toBeDisabled();
  });
});

describe('WowViewDetail — edit button', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('is not rendered when canEdit is false', () => {
    renderView({ canEdit: false });
    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
  });

  it('is disabled when isSyncing is true', () => {
    renderView({ canEdit: true, isSyncing: true });
    expect(screen.getByRole('button', { name: /edit/i })).toBeDisabled();
  });

  it('is disabled when isRunning is true', () => {
    renderView({ canEdit: true }, { isRunning: true, isDisabled: true });
    expect(screen.getByRole('button', { name: /edit/i })).toBeDisabled();
  });

  it('opens the edit panel when clicked', async () => {
    renderView({ canEdit: true });
    expect(screen.queryByTestId('edit-view')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /edit/i }));
    expect(screen.getByTestId('edit-view')).toBeInTheDocument();
  });

  it('closes the edit panel when the save is accepted', async () => {
    renderView({ canEdit: true, saveCharacters: vi.fn().mockResolvedValue(null) });
    await userEvent.click(screen.getByRole('button', { name: /edit/i }));
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.queryByTestId('edit-view')).not.toBeInTheDocument();
  });

  it('keeps the edit panel open when the save is rejected', async () => {
    renderView({
      canEdit: true,
      saveCharacters: vi.fn().mockResolvedValue('This ladder has more characters than allowed.'),
    });
    await userEvent.click(screen.getByRole('button', { name: /edit/i }));
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByTestId('edit-view')).toBeInTheDocument();
  });
});
