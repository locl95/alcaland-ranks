import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { LadderRow } from "./ladder-row.tsx";
import { RaiderioProfile } from "@/features/views/api/raiderio.ts";

vi.mock("./character-menu.tsx", () => ({
  CharacterMenu: () => <div data-testid="character-menu" />,
}));

vi.mock("./ladder-row-expanded.tsx", () => ({
  LadderRowExpanded: () => <div data-testid="ladder-row-expanded" />,
}));

vi.mock("@/features/views/constants/class-images.ts", () => ({
  CLASS_IMAGES: {} as Record<string, string>,
  getClassImageKey: () => "warrior",
}));

const makeProfile = (
  overrides: Partial<RaiderioProfile> = {},
): RaiderioProfile => ({
  id: 1,
  name: "Arthas",
  realm: "Tarren Mill",
  region: "eu",
  score: 3000,
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
  ...overrides,
});

describe("LadderRow", () => {
  it("shows syncing indicator when score is -1", () => {
    render(
      <LadderRow
        index={0}
        character={makeProfile({ score: -1 })}
        cachedCharacters={[]}
        season={null}
      />,
    );
    expect(screen.getByText("Character is syncing")).toBeInTheDocument();
  });

  it("does not show syncing indicator for normal characters", () => {
    render(
      <LadderRow
        index={0}
        character={makeProfile()}
        cachedCharacters={[]}
        season={null}
      />,
    );
    expect(screen.queryByText("Character is syncing")).not.toBeInTheDocument();
  });

  it("shows score for non-syncing characters", () => {
    render(
      <LadderRow
        index={0}
        character={makeProfile({ score: 3000 })}
        cachedCharacters={[]}
        season={null}
      />,
    );
    expect(screen.getByText("3,000")).toBeInTheDocument();
  });

  it("shows position improvement when ranked higher than cached", () => {
    const char = makeProfile({ id: 1 });
    const cachedAtRank2 = makeProfile({ id: 1, score: 2000 });
    render(
      <LadderRow
        index={0}
        character={char}
        cachedCharacters={[makeProfile({ id: 99 }), cachedAtRank2]}
        season={null}
      />,
    );
    expect(screen.getByText("↑ 1")).toBeInTheDocument();
  });

  it("toggles LadderRowExpanded on row click", async () => {
    render(
      <LadderRow
        index={0}
        character={makeProfile()}
        cachedCharacters={[]}
        season={null}
      />,
    );
    expect(screen.queryByTestId("ladder-row-expanded")).not.toBeInTheDocument();
    await userEvent.click(screen.getByText("Arthas"));
    expect(screen.getByTestId("ladder-row-expanded")).toBeInTheDocument();
    await userEvent.click(screen.getByText("Arthas"));
    expect(screen.queryByTestId("ladder-row-expanded")).not.toBeInTheDocument();
  });
});
