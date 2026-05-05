import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { SyncErrorDialog } from "./sync-error-dialog.tsx";
import { RaiderioProfile } from "@/features/views/api/raiderio.ts";

const makeProfile = (name: string): RaiderioProfile => ({
  id: Math.random(),
  name,
  realm: "Tarren Mill",
  region: "eu",
  score: 2000,
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

describe("SyncErrorDialog", () => {
  it("renders nothing when failedCharacters is empty", () => {
    const { container } = render(
      <SyncErrorDialog failedCharacters={[]} onClose={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the dialog when failedCharacters has entries", () => {
    render(
      <SyncErrorDialog
        failedCharacters={[makeProfile("Arthas")]}
        onClose={vi.fn()}
      />,
    );
    expect(
      screen.getByText("Some characters couldn't be synced"),
    ).toBeInTheDocument();
  });

  it("lists all failed character names", () => {
    render(
      <SyncErrorDialog
        failedCharacters={[makeProfile("Arthas"), makeProfile("Sylvanas")]}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText("Arthas")).toBeInTheDocument();
    expect(screen.getByText("Sylvanas")).toBeInTheDocument();
  });

  it("calls onClose when the close button is clicked", async () => {
    const onClose = vi.fn();
    render(
      <SyncErrorDialog
        failedCharacters={[makeProfile("Arthas")]}
        onClose={onClose}
      />,
    );
    await userEvent.click(screen.getByText("Got it"));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose when clicking the overlay", async () => {
    const onClose = vi.fn();
    render(
      <SyncErrorDialog
        failedCharacters={[makeProfile("Arthas")]}
        onClose={onClose}
      />,
    );
    await userEvent.click(document.querySelector(".sync-error-overlay")!);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("does not call onClose when clicking inside the dialog content", async () => {
    const onClose = vi.fn();
    render(
      <SyncErrorDialog
        failedCharacters={[makeProfile("Arthas")]}
        onClose={onClose}
      />,
    );
    await userEvent.click(document.querySelector(".sync-error-content")!);
    expect(onClose).not.toHaveBeenCalled();
  });
});
