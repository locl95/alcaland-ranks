import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CharacterMenu } from "./character-menu.tsx";
import { RaiderioProfile } from "@/features/views/api/raiderio.ts";

vi.mock("@/features/views/utils.ts", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/features/views/utils.ts")>();
  return { ...actual, openExternalProfile: vi.fn() };
});

vi.mock("@/assets/raiderio.png", () => ({ default: "raiderio.png" }));
vi.mock("@/assets/summoned.webp", () => ({ default: "summoned.webp" }));

import { openExternalProfile } from "@/features/views/utils.ts";

const makeProfile = (): RaiderioProfile => ({
  id: 1,
  name: "Arthas",
  realm: "Tarren Mill",
  region: "eu",
  score: 3000,
  class: "Death Knight",
  spec: "Frost",
  quantile: 1,
  mythicPlusBestRuns: [],
  mythicPlusRecentRuns: [],
  mythicPlusRanks: {
    overall: { world: 1, region: 1, realm: 1 },
    class: { world: 1, region: 1, realm: 1 },
    specs: [],
  },
});

describe("CharacterMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not show the dropdown by default", () => {
    render(<CharacterMenu character={makeProfile()} />);
    expect(screen.queryByText("Raider.io")).not.toBeInTheDocument();
  });

  it("shows the dropdown when the menu button is clicked", async () => {
    render(<CharacterMenu character={makeProfile()} />);
    await userEvent.click(screen.getByRole("button"));
    expect(screen.getByText("Raider.io")).toBeInTheDocument();
    expect(screen.getByText("Summoned.io")).toBeInTheDocument();
  });

  it("calls openExternalProfile with raiderio when Raider.io is clicked", async () => {
    const character = makeProfile();
    render(<CharacterMenu character={character} />);
    await userEvent.click(screen.getByRole("button"));
    await userEvent.click(screen.getByText("Raider.io"));
    expect(openExternalProfile).toHaveBeenCalledWith(character, "raiderio");
  });

  it("calls openExternalProfile with summoned when Summoned.io is clicked", async () => {
    const character = makeProfile();
    render(<CharacterMenu character={character} />);
    await userEvent.click(screen.getByRole("button"));
    await userEvent.click(screen.getByText("Summoned.io"));
    expect(openExternalProfile).toHaveBeenCalledWith(character, "summoned");
  });

  it("closes the dropdown after selecting an option", async () => {
    render(<CharacterMenu character={makeProfile()} />);
    await userEvent.click(screen.getByRole("button"));
    await userEvent.click(screen.getByText("Raider.io"));
    expect(screen.queryByText("Raider.io")).not.toBeInTheDocument();
  });

  it("closes the dropdown when clicking outside", async () => {
    render(<CharacterMenu character={makeProfile()} />);
    await userEvent.click(screen.getByRole("button"));
    expect(screen.getByText("Raider.io")).toBeInTheDocument();

    await userEvent.click(document.body);
    expect(screen.queryByText("Raider.io")).not.toBeInTheDocument();
  });
});
