import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { CharacterRun } from "./character-run.tsx";
import { MythicPlusBestRun, RaiderioProfile } from "@/features/views/api/raiderio.ts";

vi.mock("./run-details-panel.tsx", () => ({
  RunDetailsPanel: () => <div data-testid="run-details-panel" />,
}));

vi.mock("@/features/views/constants/spec-images.ts", () => ({
  SPEC_IMAGES: {} as Record<string, string>,
  getSpecImageKey: () => "warrior_arms",
}));

const makeProfile = (name = "Arthas", id = 1): RaiderioProfile => ({
  id,
  name,
  realm: "Tarren Mill",
  region: "eu",
  score: 2500,
  class: "Warrior",
  spec: "Arms",
  quantile: 1,
  mythicPlusBestRuns: [],
  mythicPlusRecentRuns: [],
  mythicPlusRanks: {
    overall: { world: 1, region: 1, realm: 1 },
    class: { world: 1, region: 1, realm: 1 },
    specs: [],
  },
});

const makeBestRun = (score = 200, level = 20): MythicPlusBestRun => ({
  run: {
    short_name: "SIEGE",
    score,
    mythic_level: level,
    num_keystone_upgrades: 3,
    clear_time_ms: 1800000,
    spec: { name: "Arms" },
  },
  details: [],
});

describe("CharacterRun", () => {
  it("shows 'No run' when there is no best run", () => {
    render(
      <CharacterRun
        character={makeProfile()}
        bestRun={undefined}
        isHighest={false}
        cachedProfiles={[]}
      />,
    );
    expect(screen.getByText("No run")).toBeInTheDocument();
  });

  it("shows the character name", () => {
    render(
      <CharacterRun
        character={makeProfile("Sylvanas")}
        bestRun={undefined}
        isHighest={false}
        cachedProfiles={[]}
      />,
    );
    expect(screen.getByText("Sylvanas")).toBeInTheDocument();
  });

  it("shows the run score when a best run is present", () => {
    render(
      <CharacterRun
        character={makeProfile()}
        bestRun={makeBestRun(215.7)}
        isHighest={false}
        cachedProfiles={[]}
      />,
    );
    expect(screen.getByText("216")).toBeInTheDocument();
  });

  it("renders the crown icon when isHighest is true", () => {
    const { container } = render(
      <CharacterRun
        character={makeProfile()}
        bestRun={makeBestRun()}
        isHighest
        cachedProfiles={[]}
      />,
    );
    expect(container.querySelector(".crown-icon")).toBeInTheDocument();
  });

  it("does not render the crown icon when isHighest is false", () => {
    const { container } = render(
      <CharacterRun
        character={makeProfile()}
        bestRun={makeBestRun()}
        isHighest={false}
        cachedProfiles={[]}
      />,
    );
    expect(container.querySelector(".crown-icon")).not.toBeInTheDocument();
  });

  it("does not expand when there is no run", async () => {
    render(
      <CharacterRun
        character={makeProfile()}
        bestRun={undefined}
        isHighest={false}
        cachedProfiles={[]}
      />,
    );
    await userEvent.click(screen.getByText("No run"));
    expect(screen.queryByTestId("run-details-panel")).not.toBeInTheDocument();
  });

  it("toggles the RunDetailsPanel on click when a run exists", async () => {
    const { container } = render(
      <CharacterRun
        character={makeProfile()}
        bestRun={makeBestRun()}
        isHighest={false}
        cachedProfiles={[]}
      />,
    );
    expect(screen.queryByTestId("run-details-panel")).not.toBeInTheDocument();
    await userEvent.click(container.querySelector(".character-run")!);
    expect(screen.getByTestId("run-details-panel")).toBeInTheDocument();
    await userEvent.click(container.querySelector(".character-run")!);
    expect(screen.queryByTestId("run-details-panel")).not.toBeInTheDocument();
  });

  it("shows score improvement when cached score is lower", () => {
    const profile = makeProfile("Arthas", 42);
    const cachedProfile = { ...profile, mythicPlusBestRuns: [
      { run: { short_name: "SIEGE", score: 180 }, details: [] } as unknown as MythicPlusBestRun,
    ] };
    profile.mythicPlusBestRuns = [
      { run: { short_name: "SIEGE", score: 200 }, details: [] } as unknown as MythicPlusBestRun,
    ];

    render(
      <CharacterRun
        character={profile}
        bestRun={makeBestRun(200)}
        isHighest={false}
        cachedProfiles={[cachedProfile]}
      />,
    );
    expect(screen.getByText("+20")).toBeInTheDocument();
  });
});
