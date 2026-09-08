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
  unchecked: [],
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
    mockCheckEntitiesExist.mockResolvedValue({ exist: [], nonExisting: [], unchecked: [] });
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

  it('never adds a character that does not exist, and keeps the name to be corrected', async () => {
    mockCheckEntitiesExist.mockResolvedValue(notFound('Fake'));
    const onSave = vi.fn();
    render(<EditView characters={[]} onClose={vi.fn()} onSave={onSave} />);

    await userEvent.type(screen.getByPlaceholderText('Name'), 'Fake');
    await userEvent.selectOptions(screen.getByTestId('realm-select'), 'tarren-mill');
    await userEvent.click(screen.getByTitle('Add'));

    expect(await screen.findByText(/Fake was not found/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete' })).toBeNull();
    expect(screen.queryByTitle('Character not found')).toBeNull();
    expect(screen.getByPlaceholderText('Name')).toHaveValue('Fake');
    expect(screen.getByText('Done')).toBeDisabled();
  });

  it('clears the rejection once the name is edited', async () => {
    mockCheckEntitiesExist.mockResolvedValue(notFound('Fake'));
    render(<EditView characters={[]} onClose={vi.fn()} onSave={vi.fn()} />);

    await userEvent.type(screen.getByPlaceholderText('Name'), 'Fake');
    await userEvent.selectOptions(screen.getByTestId('realm-select'), 'tarren-mill');
    await userEvent.click(screen.getByTitle('Add'));
    expect(await screen.findByText(/Fake was not found/)).toBeInTheDocument();

    await userEvent.clear(screen.getByPlaceholderText('Name'));

    expect(screen.queryByText(/Fake was not found/)).toBeNull();
    expect(screen.getByText('Done')).toBeEnabled();
  });

  it('holds the add row while the check is in flight, then commits it', async () => {
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
    expect(screen.getByPlaceholderText('Name')).toHaveValue('Arthas');
    expect(screen.getByPlaceholderText('Name')).toBeDisabled();
    expect(screen.queryByTitle('Add')).toBeNull();
    expect(screen.getByText('Done')).toBeDisabled();

    await act(async () => resolveCheck({ exist: [], nonExisting: [], unchecked: [] }));

    expect(screen.getByTitle('Character found')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Name')).toHaveValue('');
    expect(screen.getByPlaceholderText('Name')).toBeEnabled();
    expect(screen.getByText('Done')).toBeEnabled();
  });

  it('blocks saving while a name is typed but not added', async () => {
    render(<EditView characters={[makeProfile(1, 'Arthas')]} onClose={vi.fn()} onSave={vi.fn()} />);

    expect(screen.getByText('Done')).toBeEnabled();
    await userEvent.type(screen.getByPlaceholderText('Name'), 'Sylvanas');
    expect(screen.getByText('Done')).toBeDisabled();
  });

  it('keeps the character but marks it unverified when the backend could not check it', async () => {
    mockCheckEntitiesExist.mockResolvedValue({
      exist: [],
      nonExisting: [],
      unchecked: [{ name: 'Arthas', region: 'eu', realm: 'tarren-mill' }],
    });
    const onSave = vi.fn();
    render(<EditView characters={[]} onClose={vi.fn()} onSave={onSave} />);

    await userEvent.type(screen.getByPlaceholderText('Name'), 'Arthas');
    await userEvent.selectOptions(screen.getByTestId('realm-select'), 'tarren-mill');
    await userEvent.click(screen.getByTitle('Add'));

    expect(await screen.findByTitle('Could not be verified')).toBeInTheDocument();
    expect(screen.queryByTitle('Character found')).not.toBeInTheDocument();
    expect(screen.getByText('Done')).toBeEnabled();
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

  describe('pagination', () => {
    const manyProfiles = (count: number) =>
      Array.from({ length: count }, (_, i) => makeProfile(i + 1, `Char${i + 1}`, 2000 - i));

    const addCharacter = async (name: string) => {
      await userEvent.type(screen.getByPlaceholderText('Name'), name);
      await userEvent.selectOptions(screen.getByTestId('realm-select'), 'tarren-mill');
      await userEvent.click(screen.getByTitle('Add'));
    };

    it('renders no pager while everything fits on one page', () => {
      render(<EditView characters={manyProfiles(10)} onClose={vi.fn()} onSave={vi.fn()} />);
      expect(screen.queryByRole('navigation', { name: 'Character list pages' })).toBeNull();
    });

    it('shows only the first page once the list overflows', () => {
      render(<EditView characters={manyProfiles(12)} onClose={vi.fn()} onSave={vi.fn()} />);

      expect(screen.getByText('Char1')).toBeInTheDocument();
      expect(screen.getByText('Char10')).toBeInTheDocument();
      expect(screen.queryByText('Char11')).toBeNull();
      expect(screen.getByRole('navigation', { name: 'Character list pages' })).toBeInTheDocument();
    });

    it('reveals the rest of the list on the next page', async () => {
      render(<EditView characters={manyProfiles(12)} onClose={vi.fn()} onSave={vi.fn()} />);

      await userEvent.click(screen.getByRole('button', { name: 'Next page' }));

      expect(screen.getByText('Char11')).toBeInTheDocument();
      expect(screen.queryByText('Char1')).toBeNull();
    });

    it('shows a character added from a later page', async () => {
      render(<EditView characters={manyProfiles(12)} onClose={vi.fn()} onSave={vi.fn()} />);
      await userEvent.click(screen.getByRole('button', { name: 'Next page' }));
      expect(screen.queryByText('Char1')).toBeNull();

      await addCharacter('Newcomer');

      expect(screen.getByText('Newcomer')).toBeInTheDocument();
      expect(screen.getByText('Char1')).toBeInTheDocument();
    });

    it('keeps every character in the payload, not just the visible page', async () => {
      const onSave = vi.fn();
      render(<EditView characters={manyProfiles(12)} onClose={vi.fn()} onSave={onSave} />);

      await userEvent.click(screen.getByText('Done'));

      expect(onSave.mock.calls[0][0]).toHaveLength(12);
    });

    it('falls back to the previous page when the last one is emptied', async () => {
      render(<EditView characters={manyProfiles(11)} onClose={vi.fn()} onSave={vi.fn()} />);
      await userEvent.click(screen.getByRole('button', { name: 'Next page' }));
      expect(screen.getByText('Char11')).toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

      expect(screen.getByText('Char1')).toBeInTheDocument();
      expect(screen.queryByRole('navigation', { name: 'Character list pages' })).toBeNull();
    });

    it('adds no row anywhere when the character is rejected', async () => {
      mockCheckEntitiesExist.mockResolvedValue(notFound('Fake'));
      const onSave = vi.fn();
      render(<EditView characters={manyProfiles(12)} onClose={vi.fn()} onSave={onSave} />);

      await addCharacter('Fake');
      await screen.findByText(/Fake was not found/);

      expect(screen.queryByText('Fake')).toBeNull();
      await userEvent.click(screen.getByRole('button', { name: 'Next page' }));
      expect(screen.queryByText('Fake')).toBeNull();

      await userEvent.clear(screen.getByPlaceholderText('Name'));
      await userEvent.click(screen.getByText('Done'));
      expect(onSave.mock.calls[0][0]).toHaveLength(12);
    });
  });

  describe('ordering', () => {
    const renderedNames = () =>
      Array.from(document.querySelectorAll('.character-edit-name')).map((el) => el.textContent);

    it('lists characters by score, highest first', () => {
      render(
        <EditView
          characters={[
            makeProfile(1, 'Mid', 2000),
            makeProfile(2, 'Top', 3200),
            makeProfile(3, 'Low', 900),
          ]}
          onClose={vi.fn()}
          onSave={vi.fn()}
        />,
      );

      expect(renderedNames()).toEqual(['Top', 'Mid', 'Low']);
    });

    it('puts a newly added character above the scored ones', async () => {
      render(
        <EditView
          characters={[makeProfile(1, 'Top', 3200), makeProfile(2, 'Low', 900)]}
          onClose={vi.fn()}
          onSave={vi.fn()}
        />,
      );

      await userEvent.type(screen.getByPlaceholderText('Name'), 'Newcomer');
      await userEvent.selectOptions(screen.getByTestId('realm-select'), 'tarren-mill');
      await userEvent.click(screen.getByTitle('Add'));
      await screen.findByTitle('Character found');

      expect(renderedNames()).toEqual(['Newcomer', 'Top', 'Low']);
    });

    it('keeps the most recent addition at the very top', async () => {
      render(
        <EditView characters={[makeProfile(1, 'Top', 3200)]} onClose={vi.fn()} onSave={vi.fn()} />,
      );

      for (const name of ['First', 'Second']) {
        await userEvent.type(screen.getByPlaceholderText('Name'), name);
        await userEvent.selectOptions(screen.getByTestId('realm-select'), 'tarren-mill');
        await userEvent.click(screen.getByTitle('Add'));
        await screen.findByText(name);
      }

      expect(renderedNames()).toEqual(['Second', 'First', 'Top']);
    });
  });
});
