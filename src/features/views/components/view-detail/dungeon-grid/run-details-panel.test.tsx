import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RunDetailsPanel } from './run-details-panel.tsx';
import {
  MythicPlusRun,
  RunDetails,
  RunDetailsRosterEntry,
} from '@/features/views/api/wow-types.ts';

vi.mock('./roster-row.tsx', () => ({
  RosterRow: ({ entry }: { entry: RunDetailsRosterEntry }) => (
    <div data-testid={`roster-${entry.character.name}`}>{entry.role}</div>
  ),
}));

vi.mock('@/features/views/api/wow-types.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/views/api/wow-types.ts')>();
  return { ...actual, formatDate: () => '15-03-2024' };
});

const makeRun = (): MythicPlusRun => ({
  runId: 1,
  dungeon: 'Siege of Boralus',
  shortName: 'SIEGE',
  keyLevel: 20,
  upgrades: 3,
  dateCompleted: '2024-03-15T20:00:00Z',
  clearTimeMs: 1800000,
  dungeonTimeMs: 2200000,
  score: 300,
  url: 'https://raider.io/test',
  affixes: [],
});

const makeEntry = (name: string, role: string): RunDetailsRosterEntry => ({
  character: {
    name,
    class: { name: 'Warrior' },
    spec: { name: 'Arms' },
    realm: { id: 1, name: 'Tarren Mill', slug: 'tarren-mill' },
    region: { name: 'Europe', shortName: 'EU', slug: 'eu' },
  },
  role,
  ranks: { score: 2000 },
});

const makeDetails = (roster: RunDetailsRosterEntry[], deathCount = 0): RunDetails => ({
  roster,
  loggedDetails: {
    deaths: Array(deathCount).fill({ approximateDiedAt: 0 }),
  },
});

describe('RunDetailsPanel', () => {
  it('renders the unavailable message when details is null', () => {
    render(<RunDetailsPanel run={makeRun()} details={null} characterRegion="eu" />);
    expect(screen.getByText('Run details are currently unavailable.')).toBeInTheDocument();
  });

  it('shows death count from loggedDetails', () => {
    render(
      <RunDetailsPanel
        run={makeRun()}
        details={makeDetails([makeEntry('Arthas', 'dps')], 3)}
        characterRegion="eu"
      />,
    );
    expect(screen.getByText(/x 3/, { selector: '.run-details-deaths' })).toBeInTheDocument();
  });

  it('shows zero deaths when loggedDetails has no deaths', () => {
    render(
      <RunDetailsPanel
        run={makeRun()}
        details={{ roster: [makeEntry('Arthas', 'dps')], loggedDetails: {} }}
        characterRegion="eu"
      />,
    );
    expect(screen.getByText(/x 0/, { selector: '.run-details-deaths' })).toBeInTheDocument();
  });

  it('shows the formatted run date', () => {
    render(
      <RunDetailsPanel
        run={makeRun()}
        details={makeDetails([makeEntry('Arthas', 'dps')])}
        characterRegion="eu"
      />,
    );
    expect(screen.getByText('15-03-2024')).toBeInTheDocument();
  });

  it('sorts roster: tank first, then healer, then dps', () => {
    render(
      <RunDetailsPanel
        run={makeRun()}
        details={makeDetails([
          makeEntry('DpsPlayer', 'dps'),
          makeEntry('TankPlayer', 'tank'),
          makeEntry('HealerPlayer', 'healer'),
        ])}
        characterRegion="eu"
      />,
    );
    const rows = screen.getAllByTestId(/^roster-/);
    expect(rows[0].textContent).toBe('tank');
    expect(rows[1].textContent).toBe('healer');
    expect(rows[2].textContent).toBe('dps');
  });
});
