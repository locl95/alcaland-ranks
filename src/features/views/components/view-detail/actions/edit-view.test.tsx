import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { EditView } from "./edit-view.tsx";
import { RaiderioProfile } from "@/features/views/api/raiderio.ts";

vi.mock("@/features/views/components/shared/realm-select.tsx", () => ({
  RealmSelect: ({
    region,
    realm,
    onRegionChange,
    onRealmChange,
  }: {
    region: string;
    realm: string;
    onRegionChange: (v: string) => void;
    onRealmChange: (v: string) => void;
  }) => (
    <>
      <select
        data-testid="region-select"
        value={region}
        onChange={(e) => onRegionChange(e.target.value)}
      >
        <option value="eu">EU</option>
        <option value="us">NA</option>
      </select>
      <select
        data-testid="realm-select"
        value={realm}
        onChange={(e) => onRealmChange(e.target.value)}
      >
        <option value="">Realm</option>
        <option value="tarren-mill">Tarren Mill</option>
        <option value="silvermoon">Silvermoon</option>
      </select>
    </>
  ),
}));

const makeProfile = (id: number, name: string, score = 2000): RaiderioProfile => ({
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

describe("EditView", () => {
  it("renders nothing when closed", () => {
    const { container } = render(
      <EditView isOpen={false} characters={[]} onClose={vi.fn()} onSave={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the dialog when open", () => {
    render(<EditView isOpen characters={[]} onClose={vi.fn()} onSave={vi.fn()} />);
    expect(screen.getByText("Edit your ladder")).toBeInTheDocument();
  });

  it("lists the current characters", () => {
    render(
      <EditView
        isOpen
        characters={[makeProfile(1, "Arthas"), makeProfile(2, "Sylvanas")]}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />,
    );
    expect(screen.getByText("Arthas")).toBeInTheDocument();
    expect(screen.getByText("Sylvanas")).toBeInTheDocument();
  });

  it("excludes syncing characters (score === -1) from the list", () => {
    render(
      <EditView
        isOpen
        characters={[makeProfile(1, "Arthas", -1)]}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />,
    );
    expect(screen.queryByText("Arthas")).not.toBeInTheDocument();
  });

  it("removes a character when Delete is clicked", async () => {
    render(
      <EditView
        isOpen
        characters={[makeProfile(1, "Arthas")]}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByText("Delete"));
    expect(screen.queryByText("Arthas")).not.toBeInTheDocument();
  });

  it("calls onClose when the X button is clicked", async () => {
    const onClose = vi.fn();
    render(<EditView isOpen characters={[]} onClose={onClose} onSave={vi.fn()} />);
    await userEvent.click(document.querySelector(".edit-view-close-btn")!);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("Done button calls onSave but not onClose", async () => {
    const onClose = vi.fn();
    const onSave = vi.fn();
    render(<EditView isOpen characters={[]} onClose={onClose} onSave={onSave} />);
    await userEvent.click(screen.getByText("Done"));
    expect(onSave).toHaveBeenCalledOnce();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("calls onSave with current characters when Done is clicked", async () => {
    const onSave = vi.fn();
    render(
      <EditView
        isOpen
        characters={[makeProfile(1, "Arthas")]}
        onClose={vi.fn()}
        onSave={onSave}
      />,
    );
    await userEvent.click(screen.getByText("Done"));
    expect(onSave).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ name: "Arthas" }),
    ]));
  });

  it("calls onClose when clicking the overlay", async () => {
    const onClose = vi.fn();
    render(<EditView isOpen characters={[]} onClose={onClose} onSave={vi.fn()} />);
    await userEvent.click(document.querySelector(".edit-view-overlay")!);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("disables the add button when name or realm is empty", () => {
    render(<EditView isOpen characters={[]} onClose={vi.fn()} onSave={vi.fn()} />);
    expect(screen.getByTitle("Add")).toBeDisabled();
  });

  it("adds a character and passes it to onSave", async () => {
    const onSave = vi.fn();
    render(<EditView isOpen characters={[]} onClose={vi.fn()} onSave={onSave} />);

    await userEvent.type(screen.getByPlaceholderText("Name"), "Arthas");
    await userEvent.selectOptions(screen.getByTestId("realm-select"), "tarren-mill");
    await userEvent.click(screen.getByTitle("Add"));
    await userEvent.click(screen.getByText("Done"));

    expect(onSave).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ name: "Arthas" })]),
    );
  });
});
