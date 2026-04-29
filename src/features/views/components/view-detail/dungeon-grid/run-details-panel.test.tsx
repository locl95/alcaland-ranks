import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { RunDetailsPanel } from "./run-details-panel.tsx";
import { MythicPlusRun, RunDetails, RunDetailsRosterEntry } from "@/features/views/api/raiderio.ts";

vi.mock("./roster-row.tsx", () => ({
  RosterRow: ({ entry }: { entry: RunDetailsRosterEntry }) => (
    <div data-testid={`roster-${entry.character.name}`}>{entry.role}</div>
  ),
}));

vi.mock("@/features/views/api/raiderio.ts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/views/api/raiderio.ts")>();
  return { ...actual, formatDate: () => "15-03-2024" };
});

const makeRun = (): MythicPlusRun => ({
  keystone_run_id: 1,
  dungeon: "Siege of Boralus",
  short_name: "SIEGE",
  mythic_level: 20,
  num_keystone_upgrades: 3,
  completed_at: "2024-03-15T20:00:00Z",
  clear_time_ms: 1800000,
  score: 300,
  url: "https://raider.io/test",
  affixes: [],
});

const makeEntry = (name: string, role: string): RunDetailsRosterEntry => ({
  character: {
    name,
    class: { name: "Warrior" },
    spec: { name: "Arms" },
    realm: { id: 1, name: "Tarren Mill", slug: "tarren-mill" },
    region: { name: "Europe", short_name: "EU", slug: "eu" },
  },
  role,
  ranks: { score: 2000 },
});

const makeDetails = (
  roster: RunDetailsRosterEntry[],
  deathCount = 0,
): RunDetails => ({
  roster,
  logged_details: { deaths: Array(deathCount).fill({ character_id: 1, approximate_died_at: 0 }) },
});

describe("RunDetailsPanel", () => {
  it("renders the unavailable message when details is null", () => {
    render(<RunDetailsPanel run={makeRun()} details={null} characterRegion="eu" />);
    expect(screen.getByText("Run details are currently unavailable.")).toBeInTheDocument();
  });

  it("shows death count from logged_details", () => {
    render(
      <RunDetailsPanel
        run={makeRun()}
        details={makeDetails([makeEntry("Arthas", "dps")], 3)}
        characterRegion="eu"
      />,
    );
    expect(screen.getByText(/x 3/, { selector: ".run-details-deaths" })).toBeInTheDocument();
  });

  it("shows zero deaths when logged_details has no deaths", () => {
    render(
      <RunDetailsPanel
        run={makeRun()}
        details={{ roster: [makeEntry("Arthas", "dps")], logged_details: {} }}
        characterRegion="eu"
      />,
    );
    expect(screen.getByText(/x 0/, { selector: ".run-details-deaths" })).toBeInTheDocument();
  });

  it("shows the formatted run date", () => {
    render(
      <RunDetailsPanel
        run={makeRun()}
        details={makeDetails([makeEntry("Arthas", "dps")])}
        characterRegion="eu"
      />,
    );
    expect(screen.getByText("15-03-2024")).toBeInTheDocument();
  });

  it("renders a row for each roster entry", () => {
    render(
      <RunDetailsPanel
        run={makeRun()}
        details={makeDetails([makeEntry("Arthas", "dps"), makeEntry("Sylvanas", "healer")])}
        characterRegion="eu"
      />,
    );
    expect(screen.getByTestId("roster-Arthas")).toBeInTheDocument();
    expect(screen.getByTestId("roster-Sylvanas")).toBeInTheDocument();
  });

  it("sorts roster: tank first, then healer, then dps", () => {
    render(
      <RunDetailsPanel
        run={makeRun()}
        details={makeDetails([
          makeEntry("DpsPlayer", "dps"),
          makeEntry("TankPlayer", "tank"),
          makeEntry("HealerPlayer", "healer"),
        ])}
        characterRegion="eu"
      />,
    );
    const rows = screen.getAllByTestId(/^roster-/);
    expect(rows[0].textContent).toBe("tank");
    expect(rows[1].textContent).toBe("healer");
    expect(rows[2].textContent).toBe("dps");
  });
});
