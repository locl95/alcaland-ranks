import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { CharacterLadder } from './character-ladder.tsx';
import { WowProfile } from '@/games/wow/retail/api/wow-types.ts';

vi.mock('./ladder-row.tsx', () => ({
  LadderRow: ({ character, index }: { character: WowProfile; index: number }) => (
    <div data-testid={`ladder-row-${character.id}`}>
      #{index + 1} {character.name}
    </div>
  ),
}));

vi.mock('@/games/wow/retail/assets/keystone.webp', () => ({ default: 'keystone.webp' }));

const makeProfile = (id: number, name: string, score: number): WowProfile => ({
  id,
  name,
  realm: 'Tarren Mill',
  region: 'eu',
  score,
  class: 'Warrior',
  spec: 'Arms',
  quantile: 1,
  race: 'Human',
  faction: 'alliance',
  equippedItemLevel: 330,
  mythicPlusBestRuns: [],
  mythicPlusRecentRuns: [],
  mythicPlusRanks: {
    overall: { world: 1, region: 1, realm: 1 },
    class: { world: 1, region: 1, realm: 1 },
    specs: [],
  },
});

const makeLadder = (count: number) =>
  Array.from({ length: count }, (_, i) => makeProfile(i + 1, `Char${i + 1}`, 3000 - i * 10));

const renderLadder = (characters: WowProfile[], cachedCharacters: WowProfile[] = []) =>
  render(
    <CharacterLadder
      characters={characters}
      pendingStatuses={new Map()}
      cachedCharacters={cachedCharacters}
      season={null}
    />,
  );

describe('CharacterLadder', () => {
  it('sorts characters by score descending', () => {
    renderLadder([makeProfile(2, 'Low', 1000), makeProfile(1, 'High', 3000)]);

    expect(screen.getByTestId('ladder-row-1').textContent).toBe('#1 High');
    expect(screen.getByTestId('ladder-row-2').textContent).toBe('#2 Low');
  });

  it('collapses and expands on header click', async () => {
    renderLadder([makeProfile(1, 'Arthas', 3000)]);
    expect(screen.getByTestId('ladder-row-1')).toBeInTheDocument();

    await userEvent.click(screen.getByText('Ladder'));
    expect(screen.queryByTestId('ladder-row-1')).not.toBeInTheDocument();

    await userEvent.click(screen.getByText('Ladder'));
    expect(screen.getByTestId('ladder-row-1')).toBeInTheDocument();
  });

  it('folds from a header button that says whether it is open, hiding the controls too', async () => {
    renderLadder([makeProfile(1, 'Arthas', 3000)]);
    const toggle = screen.getByRole('button', { name: 'Ladder' });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');

    await userEvent.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
  });

  it('does not fold when a class filter in the header is picked', async () => {
    renderLadder([
      { ...makeProfile(1, 'Arthas', 3000), class: 'Death Knight' },
      { ...makeProfile(2, 'Uther', 2900), class: 'Paladin' },
    ]);

    await userEvent.click(screen.getByRole('button', { name: 'Paladin' }));

    expect(screen.getByRole('button', { name: 'Ladder' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTestId('ladder-row-2')).toBeInTheDocument();
  });
});

describe('CharacterLadder — paging', () => {
  afterEach(() => localStorage.clear());

  it('shows the whole ladder when picked, and keeps that for the next ladder', async () => {
    const { unmount } = renderLadder(makeLadder(20));
    expect(screen.getAllByTestId(/^ladder-row-/)).toHaveLength(10);

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Show' }), 'All');
    expect(screen.getAllByTestId(/^ladder-row-/)).toHaveLength(20);

    unmount();
    renderLadder(makeLadder(30));
    expect(screen.getAllByTestId(/^ladder-row-/)).toHaveLength(30);
  });

  it('shows no pager while everyone fits on one page', () => {
    renderLadder(makeLadder(10));

    expect(screen.getAllByTestId(/^ladder-row-/)).toHaveLength(10);
    expect(screen.queryByRole('navigation', { name: /pages$/i })).not.toBeInTheDocument();
  });

  it('pages the ladder, numbering rows from the page offset', async () => {
    renderLadder(makeLadder(15));

    expect(screen.getAllByTestId(/^ladder-row-/)).toHaveLength(10);
    expect(screen.getByText('1–10 of 15')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Next page' }));

    expect(screen.getByText('11–15 of 15')).toBeInTheDocument();
    expect(screen.getAllByTestId(/^ladder-row-/).map((row) => row.textContent)).toEqual([
      '#11 Char11',
      '#12 Char12',
      '#13 Char13',
      '#14 Char14',
      '#15 Char15',
    ]);
  });

  it('collapses the pager along with the rows it pages', async () => {
    renderLadder(makeLadder(15));
    expect(screen.getByRole('navigation', { name: 'Ladder pages' })).toBeInTheDocument();

    await userEvent.click(screen.getByText('Ladder'));

    expect(screen.queryByTestId('ladder-row-1')).not.toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Ladder pages' })).not.toBeInTheDocument();
    expect(screen.queryByText('1–10 of 15')).not.toBeInTheDocument();
  });
});

describe('CharacterLadder — search', () => {
  it('filters by name, keeping each character at its real rank', async () => {
    renderLadder([
      makeProfile(1, 'Arthas', 3000),
      makeProfile(2, 'Jaína', 2900),
      makeProfile(3, 'Thrall', 2800),
    ]);

    await userEvent.type(screen.getByRole('searchbox', { name: 'Search character' }), 'JAINA');

    expect(screen.getAllByTestId(/^ladder-row-/).map((row) => row.textContent)).toEqual([
      '#2 Jaína',
    ]);
  });

  it('does not collapse the ladder when the search is clicked', async () => {
    renderLadder([makeProfile(1, 'Arthas', 3000)]);

    await userEvent.click(screen.getByRole('searchbox'));

    expect(screen.getByTestId('ladder-row-1')).toBeInTheDocument();
  });

  it('goes back to the first page and says so when nothing matches', async () => {
    renderLadder(makeLadder(25));
    await userEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(screen.getByText('11–20 of 25')).toBeInTheDocument();

    await userEvent.type(screen.getByRole('searchbox'), 'Char');
    expect(screen.getByText('1–10 of 25')).toBeInTheDocument();

    await userEvent.type(screen.getByRole('searchbox'), 'zzz');
    expect(screen.queryAllByTestId(/^ladder-row-/)).toHaveLength(0);
    expect(screen.getByText('No characters match.')).toBeInTheDocument();
  });
});

const rowTexts = () => screen.getAllByTestId(/^ladder-row-/).map((row) => row.textContent);

describe('CharacterLadder — class filter', () => {
  const ladder = [
    { ...makeProfile(1, 'Arthas', 3000), class: 'Death Knight' },
    { ...makeProfile(2, 'Uther', 2900), class: 'Paladin' },
    { ...makeProfile(3, 'Thrall', 2800), class: 'Shaman' },
    { ...makeProfile(4, 'Tirion', 2700), class: 'Paladin' },
  ];

  it('offers the classes in the ladder, and filters by one keeping real ranks', async () => {
    renderLadder(ladder);
    const filter = screen.getByRole('group', { name: 'Class' });
    expect(
      within(filter)
        .getAllByRole('button')
        .map((b) => b.getAttribute('aria-label')),
    ).toEqual(['Death Knight', 'Paladin', 'Shaman']);

    await userEvent.click(within(filter).getByRole('button', { name: 'Paladin' }));

    expect(rowTexts()).toEqual(['#2 Uther', '#4 Tirion']);
  });

  it('clears the filter when the picked class is clicked again', async () => {
    renderLadder(ladder);
    const paladin = screen.getByRole('button', { name: 'Paladin' });

    await userEvent.click(paladin);
    await userEvent.click(paladin);

    expect(rowTexts()).toHaveLength(4);
  });

  it('hides when the whole ladder is one class', () => {
    renderLadder([makeProfile(1, 'Arthas', 3000), makeProfile(2, 'Garrosh', 2900)]);

    expect(screen.queryByRole('group', { name: 'Class' })).not.toBeInTheDocument();
  });
});

describe('CharacterLadder — sorting', () => {
  const ladder = [
    { ...makeProfile(1, 'Arthas', 3000), equippedItemLevel: 640 },
    { ...makeProfile(2, 'Uther', 2900), equippedItemLevel: 660 },
    { ...makeProfile(3, 'Thrall', 2800), equippedItemLevel: 650 },
  ];

  it('sorts by item level, highest first, then flips', async () => {
    renderLadder(ladder);

    await userEvent.click(screen.getByRole('button', { name: 'iLvl' }));
    expect(rowTexts()).toEqual(['#2 Uther', '#3 Thrall', '#1 Arthas']);

    await userEvent.click(screen.getByRole('button', { name: /^iLvl/ }));
    expect(rowTexts()).toEqual(['#1 Arthas', '#3 Thrall', '#2 Uther']);
  });

  it('sorts by score lowest first when its header is clicked', async () => {
    renderLadder(ladder);

    await userEvent.click(screen.getByRole('button', { name: /^M\+ score/ }));

    expect(rowTexts()).toEqual(['#3 Thrall', '#2 Uther', '#1 Arthas']);
  });
});
