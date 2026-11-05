import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { League, LolPlayer } from '@/games/lol/lol-types.ts';
import { LolLadder } from './lol-ladder.tsx';

vi.mock('@/games/lol/data-dragon.ts', () => ({
  useDataDragonVersion: () => undefined,
  profileIconUrl: () => '',
}));

const league = (tier: string, rank: string, lp: number, winrate = 0.5): League => ({
  tier,
  rank,
  leaguePoints: lp,
  gamesPlayed: 20,
  winrate,
  teamPosition: 'TOP',
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
  player('Goldie', league('GOLD', 'I', 5, 0.4)),
  player('NoRanked'),
];

const renderLadder = (queue: 'solo' | 'flex' = 'solo', onQueueChange = vi.fn()) => {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <LolLadder
        players={players}
        cachedPlayers={[player('Goldie', league('GOLD', 'II', 80))]}
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
});
