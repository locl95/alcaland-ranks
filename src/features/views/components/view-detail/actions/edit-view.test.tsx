import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EditView } from './edit-view.tsx';
import { RaiderioProfile } from '@/features/views/api/raiderio.ts';

const mockCheckEntitiesExist = vi.fn();

vi.mock('@/shared/api/httpClient.ts', () => ({
  serviceRequest: (...args: unknown[]) => mockCheckEntitiesExist(...args),
}));

const notFound = (name: string, realm = 'tarren-mill') => ({
  exist: [],
  nonExisting: [{ name, region: 'eu', realm }],
});

vi.mock('@/features/views/components/shared/realm-select.tsx', () => ({
  RealmSelect: ({
    region,
    realm,
    onRegionChange,
    onRealmChange,
  }: {
    region: string;
    realm: string;
    onRegionChange: (v: string) => void;
    onRealmChange: (v: string) => void;
  }) => (
    <>
      <select
        data-testid="region-select"
        value={region}
        onChange={(e) => onRegionChange(e.target.value)}
      >
        <option value="eu">EU</option>
        <option value="us">NA</option>
      </select>
      <select
        data-testid="realm-select"
        value={realm}
        onChange={(e) => onRealmChange(e.target.value)}
      >
        <option value="">Realm</option>
        <option value="tarren-mill">Tarren Mill</option>
        <option value="silvermoon">Silvermoon</option>
        <option value="zuljin">Zul&apos;jin</option>
      </select>
    </>
  ),
}));

const makeProfile = (id: number, name: string, score: number | null = 2000): RaiderioProfile => ({
  id,
  name,
  realm: 'Tarren Mill',
  region: 'eu',
  score,
  class: 'Warrior',
  spec: 'Arms',
  quantile: 1,
  mythicPlusBestRuns: [],
  mythicPlusRecentRuns: [],
  mythicPlusRanks: {
    overall: { world: 1, region: 1, realm: 1 },
    class: { world: 1, region: 1, realm: 1 },
    specs: [],
  },
});

describe('EditView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckEntitiesExist.mockResolvedValue({ exist: [], nonExisting: [] });
  });

  it('renders the dialog when open', () => {
    render(<EditView characters={[]} onClose={vi.fn()} onSave={vi.fn()} />);
    expect(screen.getByText('Edit your ladder')).toBeInTheDocument();
  });

  it('lists the current characters', () => {
    render(
      <EditView
        characters={[makeProfile(1, 'Arthas'), makeProfile(2, 'Sylvanas')]}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />,
    );
    expect(screen.getByText('Arthas')).toBeInTheDocument();
    expect(screen.getByText('Sylvanas')).toBeInTheDocument();
  });

  it('excludes syncing characters (score === null) from the list', () => {
    render(
      <EditView characters={[makeProfile(1, 'Arthas', null)]} onClose={vi.fn()} onSave={vi.fn()} />,
    );
    expect(screen.queryByText('Arthas')).not.toBeInTheDocument();
  });

  it('removes a character when Delete is clicked', async () => {
    render(<EditView characters={[makeProfile(1, 'Arthas')]} onClose={vi.fn()} onSave={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(screen.queryByText('Arthas')).not.toBeInTheDocument();
  });

  it('calls onClose when the X button is clicked', async () => {
    const onClose = vi.fn();
    render(<EditView characters={[]} onClose={onClose} onSave={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('Done button calls onSave but not onClose', async () => {
    const onClose = vi.fn();
    const onSave = vi.fn();
    render(<EditView characters={[]} onClose={onClose} onSave={onSave} />);
    await userEvent.click(screen.getByText('Done'));
    expect(onSave).toHaveBeenCalledOnce();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onSave with current characters when Done is clicked', async () => {
    const onSave = vi.fn();
    render(<EditView characters={[makeProfile(1, 'Arthas')]} onClose={vi.fn()} onSave={onSave} />);
    await userEvent.click(screen.getByText('Done'));
    expect(onSave).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ name: 'Arthas' })]),
    );
  });

  it('calls onClose when clicking the overlay', async () => {
    const onClose = vi.fn();
    render(<EditView characters={[]} onClose={onClose} onSave={vi.fn()} />);
    await userEvent.click(screen.getByTestId('edit-view-overlay'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('disables the add button when name or realm is empty', () => {
    render(<EditView characters={[]} onClose={vi.fn()} onSave={vi.fn()} />);
    expect(screen.getByTitle('Add')).toBeDisabled();
  });

  it('adds a character and passes it to onSave', async () => {
    const onSave = vi.fn();
    render(<EditView characters={[]} onClose={vi.fn()} onSave={onSave} />);

    await userEvent.type(screen.getByPlaceholderText('Name'), 'Arthas');
    await userEvent.selectOptions(screen.getByTestId('realm-select'), 'tarren-mill');
    await userEvent.click(screen.getByTitle('Add'));
    await userEvent.click(screen.getByText('Done'));

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
    expect(onSave).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ name: 'Arthas' })]),
    );
  });

  it('marks a verified character with a found indicator', async () => {
    render(<EditView characters={[]} onClose={vi.fn()} onSave={vi.fn()} />);

    await userEvent.type(screen.getByPlaceholderText('Name'), 'Arthas');
    await userEvent.selectOptions(screen.getByTestId('realm-select'), 'tarren-mill');
    await userEvent.click(screen.getByTitle('Add'));

    expect(await screen.findByTitle('Character found')).toBeInTheDocument();
  });

  it('marks a character that does not exist and blocks saving', async () => {
    mockCheckEntitiesExist.mockResolvedValue(notFound('Fake'));
    const onSave = vi.fn();
    render(<EditView characters={[]} onClose={vi.fn()} onSave={onSave} />);

    await userEvent.type(screen.getByPlaceholderText('Name'), 'Fake');
    await userEvent.selectOptions(screen.getByTestId('realm-select'), 'tarren-mill');
    await userEvent.click(screen.getByTitle('Add'));

    expect(await screen.findByTitle('Character not found')).toBeInTheDocument();
    expect(screen.getByText(/Fake was not found/)).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(screen.getByText('Done')).toBeEnabled();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('clears the input on add so another character can be typed while checking', async () => {
    let resolveCheck: (value: unknown) => void = () => {};
    mockCheckEntitiesExist.mockReturnValue(
      new Promise((resolve) => {
        resolveCheck = resolve;
      }),
    );
    render(<EditView characters={[]} onClose={vi.fn()} onSave={vi.fn()} />);

    await userEvent.type(screen.getByPlaceholderText('Name'), 'Arthas');
    await userEvent.selectOptions(screen.getByTestId('realm-select'), 'tarren-mill');
    await userEvent.click(screen.getByTitle('Add'));

    expect(screen.getByTitle('Checking character')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Name')).toHaveValue('');
    expect(screen.getByText('Done')).toBeDisabled();

    await userEvent.type(screen.getByPlaceholderText('Name'), 'Sylvanas');
    await userEvent.selectOptions(screen.getByTestId('realm-select'), 'silvermoon');
    expect(screen.getByTitle('Add')).toBeEnabled();

    await act(async () => resolveCheck({ exist: [], nonExisting: [] }));
    expect(screen.getByTitle('Character found')).toBeInTheDocument();
  });

  it('blocks saving while a name is typed but not added', async () => {
    render(<EditView characters={[makeProfile(1, 'Arthas')]} onClose={vi.fn()} onSave={vi.fn()} />);

    expect(screen.getByText('Done')).toBeEnabled();
    await userEvent.type(screen.getByPlaceholderText('Name'), 'Sylvanas');
    expect(screen.getByText('Done')).toBeDisabled();
  });

  it('keeps the character but marks it unverified when the lookup fails', async () => {
    mockCheckEntitiesExist.mockRejectedValue(new Error('Network error'));
    const onSave = vi.fn();
    render(<EditView characters={[]} onClose={vi.fn()} onSave={onSave} />);

    await userEvent.type(screen.getByPlaceholderText('Name'), 'Arthas');
    await userEvent.selectOptions(screen.getByTestId('realm-select'), 'tarren-mill');
    await userEvent.click(screen.getByTitle('Add'));

    expect(await screen.findByTitle('Could not be verified')).toBeInTheDocument();
    expect(screen.queryByTitle('Character found')).not.toBeInTheDocument();

    await userEvent.click(screen.getByText('Done'));
    expect(onSave).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ name: 'Arthas' })]),
    );
  });

  it('rejects a character already on the ladder', async () => {
    const onSave = vi.fn();
    render(<EditView characters={[makeProfile(1, 'Arthas')]} onClose={vi.fn()} onSave={onSave} />);
    mockCheckEntitiesExist.mockClear();

    await userEvent.type(screen.getByPlaceholderText('Name'), 'arthas');
    await userEvent.selectOptions(screen.getByTestId('realm-select'), 'tarren-mill');
    await userEvent.click(screen.getByTitle('Add'));

    expect(screen.getByText('arthas is already in this ladder.')).toBeInTheDocument();
    expect(screen.getAllByText(/^[Aa]rthas$/)).toHaveLength(1);
    expect(mockCheckEntitiesExist).not.toHaveBeenCalled();

    expect(screen.getByPlaceholderText('Name')).toHaveValue('arthas');
    await userEvent.clear(screen.getByPlaceholderText('Name'));
    expect(screen.queryByText('arthas is already in this ladder.')).not.toBeInTheDocument();
  });

  it('keeps unsaved work when view data refetches while the dialog is open', async () => {
    const { rerender } = render(
      <EditView characters={[makeProfile(1, 'Arthas')]} onClose={vi.fn()} onSave={vi.fn()} />,
    );

    await userEvent.type(screen.getByPlaceholderText('Name'), 'Sylvanas');
    await userEvent.selectOptions(screen.getByTestId('realm-select'), 'silvermoon');
    await userEvent.click(screen.getByTitle('Add'));
    expect(await screen.findByTitle('Character found')).toBeInTheDocument();

    await act(async () => {
      rerender(
        <EditView
          characters={[makeProfile(1, 'Arthas', 2500)]}
          onClose={vi.fn()}
          onSave={vi.fn()}
        />,
      );
    });

    expect(screen.getByText('Sylvanas')).toBeInTheDocument();
    expect(screen.getByTitle('Character found')).toBeInTheDocument();
  });

  it('re-snapshots the roster when the dialog is reopened', async () => {
    const props = { onClose: vi.fn(), onSave: vi.fn() };
    const { unmount } = render(<EditView characters={[makeProfile(1, 'Arthas')]} {...props} />);

    await userEvent.type(screen.getByPlaceholderText('Name'), 'Sylvanas');
    await userEvent.selectOptions(screen.getByTestId('realm-select'), 'silvermoon');
    await userEvent.click(screen.getByTitle('Add'));
    expect(screen.getByText('Sylvanas')).toBeInTheDocument();

    // The parent mounts the dialog only while open, so reopening is a fresh mount.
    unmount();
    render(<EditView characters={[makeProfile(2, 'Jaina')]} {...props} />);

    expect(screen.queryByText('Sylvanas')).not.toBeInTheDocument();
    expect(screen.getByText('Jaina')).toBeInTheDocument();
  });

  it('matches realms whose slug is not derivable from the label', async () => {
    const onZuljin = { ...makeProfile(1, 'Arthas'), realm: "Zul'jin" };
    render(<EditView characters={[onZuljin]} onClose={vi.fn()} onSave={vi.fn()} />);

    await userEvent.type(screen.getByPlaceholderText('Name'), 'Arthas');
    await userEvent.selectOptions(screen.getByTestId('realm-select'), 'zuljin');
    await userEvent.click(screen.getByTitle('Add'));

    expect(screen.getByText('Arthas is already in this ladder.')).toBeInTheDocument();
  });
});
