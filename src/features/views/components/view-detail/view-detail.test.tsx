import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ViewDetail } from './view-detail.tsx';
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
vi.mock('@/features/views/hooks/useViewDetail.ts', () => ({
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
  EditView: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="edit-view" /> : null,
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
  return render(<ViewDetail />);
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ViewDetail — sync button', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls triggerSync when the sync button is clicked', async () => {
    const triggerSync = vi.fn();
    renderView({}, { triggerSync });
    await userEvent.click(screen.getByRole('button', { name: /sync/i }));
    expect(triggerSync).toHaveBeenCalledOnce();
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

  it('shows the countdown label as button text when in cooldown', () => {
    renderView({}, { isDisabled: true, countdownLabel: '45s' });
    expect(screen.getByRole('button', { name: /45s/i })).toBeInTheDocument();
  });

  it('shows the statusMessage as the button title', () => {
    renderView({}, { statusMessage: 'Synced successfully' });
    expect(screen.getByRole('button', { name: /sync/i }).title).toBe('Synced successfully');
  });

  it('shows "Next sync in …" as the button title when in cooldown and no statusMessage', () => {
    renderView({}, { countdownLabel: '30s' });
    expect(screen.getByRole('button', { name: /30s/i }).title).toBe('Next sync in 30s');
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

describe('ViewDetail — edit button', () => {
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
});
