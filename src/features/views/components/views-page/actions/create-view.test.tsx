import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CreateView } from "./create-view.tsx";
import { View } from "@/features/views/model/view.ts";

const mockForm = vi.hoisted(() => ({
  name: "",
  setName: vi.fn(),
  characters: [{ name: "", realm: "", region: "eu", mode: "add" as const }],
  canSubmit: false,
  error: null as string | null,
  updateCharacter: vi.fn(),
  addCharacter: vi.fn(),
  removeCharacter: vi.fn(),
  handleSubmit: vi.fn((e) => e.preventDefault()),
}));

vi.mock("@/features/views/hooks/useCreateViewForm.ts", () => ({
  useCreateViewForm: () => mockForm,
}));

vi.mock("@/features/views/components/shared/realm-select.tsx", () => ({
  RealmSelect: () => <div data-testid="realm-select" />,
}));

describe("CreateView", () => {
  const onOpenChange = vi.fn();
  const onCreateView = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockForm.name = "";
    mockForm.characters = [{ name: "", realm: "", region: "eu", mode: "add" as const }];
    mockForm.canSubmit = false;
    mockForm.error = null;
  });

  it("renders nothing when closed", () => {
    const { container } = render(
      <CreateView open={false} onOpenChange={onOpenChange} onCreateView={onCreateView} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the dialog when open", () => {
    render(<CreateView open onOpenChange={onOpenChange} onCreateView={onCreateView} />);
    expect(screen.getByText("Create new m+ ladder")).toBeInTheDocument();
  });

  it("calls onOpenChange(false) when the close button is clicked", async () => {
    render(<CreateView open onOpenChange={onOpenChange} onCreateView={onCreateView} />);
    await userEvent.click(document.querySelector(".dialog-close-btn")!);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("calls onOpenChange(false) when clicking the overlay", async () => {
    render(<CreateView open onOpenChange={onOpenChange} onCreateView={onCreateView} />);
    await userEvent.click(document.querySelector(".dialog-overlay")!);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("disables the submit button when canSubmit is false", () => {
    render(<CreateView open onOpenChange={onOpenChange} onCreateView={onCreateView} />);
    expect(screen.getByRole("button", { name: "Create" })).toBeDisabled();
  });

  it("enables the submit button when canSubmit is true", () => {
    mockForm.canSubmit = true;
    render(<CreateView open onOpenChange={onOpenChange} onCreateView={onCreateView} />);
    expect(screen.getByRole("button", { name: "Create" })).not.toBeDisabled();
  });

  it("renders an error when form returns one", () => {
    mockForm.error = "Failed to create ladder. Please try again.";
    render(<CreateView open onOpenChange={onOpenChange} onCreateView={onCreateView} />);
    expect(screen.getByText("Failed to create ladder. Please try again.")).toBeInTheDocument();
  });

  it("closes when Escape is pressed", async () => {
    render(<CreateView open onOpenChange={onOpenChange} onCreateView={onCreateView} />);
    await userEvent.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
