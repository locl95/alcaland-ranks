import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RunDetailsPanel } from './run-details-panel.tsx';
import { MythicPlusRun, RunDetails, RunDetailsMember } from '@/features/views/api/wow-types.ts';

vi.mock('./roster-row.tsx', () => ({
  RosterRow: ({ member }: { member: RunDetailsMember }) => (
    <div data-testid={`roster-${member.name}`}>{member.spec.role}</div>
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

const makeMember = (name: string, role: string): RunDetailsMember => ({
  name,
  realm: 'tarren-mill',
  class: 'Warrior',
  spec: { id: 71, name: 'Arms', role },
  race: 'Human',
  itemLevel: 328,
});

const makeDetails = (members: RunDetailsMember[]): RunDetails => ({ members });

describe('RunDetailsPanel', () => {
  it('renders the unavailable message when details is null', () => {
    render(<RunDetailsPanel run={makeRun()} details={null} characterRegion="eu" />);
    expect(screen.getByText('Run details are currently unavailable.')).toBeInTheDocument();
  });

  it('shows the formatted run date', () => {
    render(
      <RunDetailsPanel
        run={makeRun()}
        details={makeDetails([makeMember('Arthas', 'dps')])}
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
          makeMember('DpsPlayer', 'dps'),
          makeMember('TankPlayer', 'tank'),
          makeMember('HealerPlayer', 'healer'),
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
