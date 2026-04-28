import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { CharacterLadder } from "./character-ladder.tsx";
import { RaiderioProfile } from "@/features/views/api/raiderio.ts";

vi.mock("./ladder-row.tsx", () => ({
  LadderRow: ({ character, index }: { character: RaiderioProfile; index: number }) => (
    <div data-testid={`ladder-row-${character.id}`}>
      #{index + 1} {character.name}
    </div>
  ),
}));

vi.mock("@/assets/keystone.webp", () => ({ default: "keystone.webp" }));

const makeProfile = (id: number, name: string, score: number): RaiderioProfile => ({
  id,
  name,
  realm: "Tarren Mill",
  region: "eu",
  score,
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

describe("CharacterLadder", () => {
  it("renders a row for each character", () => {
    render(
      <CharacterLadder
        characters={[makeProfile(1, "Arthas", 3000), makeProfile(2, "Sylvanas", 2500)]}
        cachedCharacters={[]}
        season={null}
      />,
    );
    expect(screen.getByTestId("ladder-row-1")).toBeInTheDocument();
    expect(screen.getByTestId("ladder-row-2")).toBeInTheDocument();
  });

  it("sorts characters by score descending", () => {
    render(
      <CharacterLadder
        characters={[makeProfile(2, "Low", 1000), makeProfile(1, "High", 3000)]}
        cachedCharacters={[]}
        season={null}
      />,
    );
    // The mock renders "#{index+1} {name}" — index 0 means rank #1 position
    expect(screen.getByTestId("ladder-row-1").textContent).toBe("#1 High");
    expect(screen.getByTestId("ladder-row-2").textContent).toBe("#2 Low");
  });

  it("collapses and expands on header click", async () => {
    render(
      <CharacterLadder
        characters={[makeProfile(1, "Arthas", 3000)]}
        cachedCharacters={[]}
        season={null}
      />,
    );
    expect(screen.getByTestId("ladder-row-1")).toBeInTheDocument();

    await userEvent.click(screen.getByText("Ladder"));
    expect(screen.queryByTestId("ladder-row-1")).not.toBeInTheDocument();

    await userEvent.click(screen.getByText("Ladder"));
    expect(screen.getByTestId("ladder-row-1")).toBeInTheDocument();
  });

  it("renders nothing in the content when there are no characters", () => {
    render(
      <CharacterLadder characters={[]} cachedCharacters={[]} season={null} />,
    );
    expect(screen.queryByTestId(/ladder-row/)).not.toBeInTheDocument();
  });
});
