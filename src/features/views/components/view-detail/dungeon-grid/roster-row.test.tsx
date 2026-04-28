import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { RosterRow } from "./roster-row.tsx";
import { RunDetailsRosterEntry } from "@/features/views/api/raiderio.ts";

vi.mock("@/features/views/constants/spec-images.ts", () => ({
  SPEC_IMAGES: { warrior_arms: "warrior_arms.webp" },
  getSpecImageKey: (_cls: string, spec: string) => `warrior_${spec.toLowerCase()}`,
}));

vi.mock("@/features/views/constants/role-images.ts", () => ({
  ROLE_IMAGES: { tank: "tank.webp", healer: "healer.webp", dps: "dps.webp" },
}));

vi.mock("@/features/views/utils.ts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/views/utils.ts")>();
  return { ...actual, openExternalProfile: vi.fn() };
});

import { openExternalProfile } from "@/features/views/utils.ts";

const makeEntry = (
  name: string,
  role = "dps",
  score = 2500,
): RunDetailsRosterEntry => ({
  character: {
    name,
    class: { name: "Warrior" },
    spec: { name: "Arms" },
    realm: { id: 1, name: "Tarren Mill", slug: "tarren-mill" },
    region: { name: "Europe", short_name: "EU", slug: "eu" },
  },
  role,
  ranks: { score },
});

describe("RosterRow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the character name", () => {
    render(<RosterRow entry={makeEntry("Arthas")} characterRegion="eu" />);
    expect(screen.getByText("Arthas")).toBeInTheDocument();
  });

  it("renders the realm name", () => {
    render(<RosterRow entry={makeEntry("Arthas")} characterRegion="eu" />);
    expect(screen.getByText("Tarren Mill")).toBeInTheDocument();
  });

  it("renders the score rounded to nearest integer", () => {
    render(<RosterRow entry={makeEntry("Arthas", "dps", 2567.8)} characterRegion="eu" />);
    expect(screen.getByText("2568")).toBeInTheDocument();
  });

  it("renders the role icon with correct alt text", () => {
    render(<RosterRow entry={makeEntry("Arthas", "tank")} characterRegion="eu" />);
    expect(screen.getByAltText("Tank")).toBeInTheDocument();
  });

  it("calls openExternalProfile with raiderio when the row is clicked", async () => {
    render(<RosterRow entry={makeEntry("Arthas")} characterRegion="eu" />);
    await userEvent.click(screen.getByText("Arthas"));
    expect(openExternalProfile).toHaveBeenCalledWith(
      { name: "Arthas", realm: "tarren-mill", region: "eu" },
      "raiderio",
    );
  });

  it("passes the characterRegion prop through to openExternalProfile", async () => {
    render(<RosterRow entry={makeEntry("Arthas")} characterRegion="us" />);
    await userEvent.click(screen.getByText("Arthas"));
    expect(openExternalProfile).toHaveBeenCalledWith(
      expect.objectContaining({ region: "us" }),
      "raiderio",
    );
  });
});
