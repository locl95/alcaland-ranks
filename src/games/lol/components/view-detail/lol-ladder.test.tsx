import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { League, LolMatch, LolPlayer } from '@/games/lol/api/lol-types.ts';
import { PendingPlayer } from '@/games/lol/hooks/useSaveLolView.ts';
import { LolLadder } from './lol-ladder.tsx';

vi.mock('@/games/lol/api/data-dragon.ts', () => ({
  useDataDragonVersion: () => undefined,
  useChampion: () => () => undefined,
  profileIconUrl: () => '',
}));

const soloMatch: LolMatch = {
  id: 'EUW1_1',
  championId: 64,
  championName: 'LeeSin',
  individualPosition: 'JUNGLE',
  kills: 7,
  deaths: 2,
  assists: 11,
  wardsPlaced: 14,
  visionWardsBoughtInGame: 3,
  totalTimeSpentDead: 95,
  gameDuration: 1680,
  gameFinishedCorrectly: true,
  win: true,
  matchUp: { championId: 254, championName: 'Vi', kills: 3, deaths: 6, assists: 4 },
};

const league = (
  tier: string,
  rank: string,
  lp: number,
  winrate = 0.5,
  matches: LolMatch[] = [],
): League => ({
  tier,
  rank,
  leaguePoints: lp,
  gamesPlayed: 20,
  winrate,
  teamPosition: 'TOP',
  matches,
});

const player = (name: string, solo?: League, flex?: League): LolPlayer => ({
  type: 'lol',
  summonerIcon: 1,
  summonerLevel: 100,
  summonerName: name,
  summonerTag: 'EUW',
  leagues: { SOLO_Q: solo, FLEX_Q: flex },
});

const players = [
  player('Silvy', league('SILVER', 'II', 40, 0.7), league('GOLD', 'IV', 10)),
  player('Goldie', league('GOLD', 'I', 5, 0.4, [soloMatch])),
  player('NoRanked'),
];

const renderLadder = (
  queue: 'solo' | 'flex' = 'solo',
  onQueueChange = vi.fn(),
  pending: PendingPlayer[] = [],
) => {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <LolLadder
        players={players}
        cachedPlayers={[player('Goldie', league('GOLD', 'II', 80))]}
        pending={pending}
        queue={queue}
        onQueueChange={onQueueChange}
      />
    </QueryClientProvider>,
  );
  return { onQueueChange };
};

const playerNames = () =>
  screen
    .getAllByRole('row')
    .slice(1)
    .map((row) => within(row).getAllByRole('cell')[1].textContent);

describe('LolLadder', () => {
  it('orders by rank, with players who have not played the queue last as Unranked', () => {
    renderLadder();

    expect(playerNames()).toEqual(['Goldie#EUW', 'Silvy#EUW', 'NoRanked#EUW']);
    expect(screen.getByText('Unranked')).toBeInTheDocument();
  });

  it('shows the LP gained since the last snapshot', () => {
    renderLadder();
    expect(screen.getByText('+25')).toBeInTheDocument();
  });

  it('shows the selected queue’s ranks', () => {
    renderLadder('flex');

    expect(playerNames()).toEqual(['Silvy#EUW', 'Goldie#EUW', 'NoRanked#EUW']);
    expect(screen.getAllByText('Unranked')).toHaveLength(2);
  });

  it('asks to switch queue', async () => {
    const { onQueueChange } = renderLadder();
    await userEvent.click(screen.getByRole('button', { name: 'Flex' }));
    expect(onQueueChange).toHaveBeenCalledWith('flex');
  });

  it('re-sorts by a column and flips the order on a second click', async () => {
    renderLadder();

    await userEvent.click(screen.getByRole('button', { name: 'Winrate' }));
    expect(playerNames()).toEqual(['Silvy#EUW', 'Goldie#EUW', 'NoRanked#EUW']);

    await userEvent.click(screen.getByRole('button', { name: /Winrate/ }));
    expect(playerNames()).toEqual(['Goldie#EUW', 'Silvy#EUW', 'NoRanked#EUW']);
  });

  it('filters by player name or tier', async () => {
    renderLadder();

    await userEvent.type(screen.getByRole('searchbox'), 'silver');
    expect(playerNames()).toEqual(['Silvy#EUW']);
  });

  it('expands a player into their games in the selected queue and opens a matchup', async () => {
    renderLadder();

    await userEvent.click(screen.getByRole('button', { name: /Goldie/ }));
    expect(screen.getByRole('button', { name: /Goldie/ })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Last 1 games')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /7\/2\/11/ }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Victory')).toBeInTheDocument();
    expect(within(dialog).getByText('3 / 6 / 4')).toBeInTheDocument();
    expect(within(dialog).getByText('1:35')).toBeInTheDocument();

    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('expands a player from anywhere on their row, but not from the op.gg link', async () => {
    renderLadder();
    const goldie = screen.getByRole('button', { name: /Goldie/ });

    await userEvent.click(screen.getByText('Gold I'));
    expect(goldie).toHaveAttribute('aria-expanded', 'true');

    await userEvent.click(screen.getByRole('link', { name: 'Goldie#EUW on op.gg' }));
    expect(goldie).toHaveAttribute('aria-expanded', 'true');

    await userEvent.click(screen.getByText('Gold I'));
    expect(goldie).toHaveAttribute('aria-expanded', 'false');
  });

  it('shows each player’s recent form', () => {
    renderLadder();
    expect(screen.getByRole('img', { name: 'Last 1 games: 1 wins, 0 losses' })).toBeInTheDocument();
  });

  it('lists players being added or removed at the bottom, without stats', () => {
    renderLadder('solo', vi.fn(), [
      { name: 'Chovy', tag: 'KR2', status: 'syncing' },
      { name: 'Caps', tag: 'EUW', status: 'deleting' },
    ]);

    const rows = screen.getAllByRole('row').slice(-2);
    expect(rows[0]).toHaveTextContent('Chovy#KR2Syncing…');
    expect(rows[1]).toHaveTextContent('Caps#EUWDeleting…');
    expect(within(rows[0]).queryByRole('button')).not.toBeInTheDocument();
  });

  it('does not let an unranked player expand', () => {
    renderLadder();
    expect(screen.queryByRole('button', { name: /NoRanked/ })).not.toBeInTheDocument();
  });
});
