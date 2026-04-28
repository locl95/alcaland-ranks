import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useCreateViewForm } from "./useCreateViewForm.ts";

const mockUserRequest = vi.fn();

vi.mock("@/shared/api/httpClient.ts", () => ({
  userRequest: (...args: unknown[]) => mockUserRequest(...args),
}));

const onClose = vi.fn();
const onCreateView = vi.fn();

const renderForm = (open = true) =>
  renderHook(() => useCreateViewForm(open, onClose, onCreateView));

describe("useCreateViewForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUserRequest.mockResolvedValue(undefined);
  });

  describe("initial state", () => {
    it("starts with empty name, one empty row, no error and canSubmit false", () => {
      const { result } = renderForm();
      expect(result.current.name).toBe("");
      expect(result.current.characters).toHaveLength(1);
      expect(result.current.characters[0].mode).toBe("add");
      expect(result.current.canSubmit).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe("updateCharacter", () => {
    it("updates the name field at the given index", () => {
      const { result } = renderForm();
      act(() => result.current.updateCharacter(0, "name", "Arthas"));
      expect(result.current.characters[0].name).toBe("Arthas");
    });

    it("updates the realm field at the given index", () => {
      const { result } = renderForm();
      act(() => result.current.updateCharacter(0, "realm", "Tarren Mill"));
      expect(result.current.characters[0].realm).toBe("Tarren Mill");
    });
  });

  describe("addCharacter", () => {
    it("marks the current row as added and appends a new empty row", () => {
      const { result } = renderForm();
      act(() => {
        result.current.updateCharacter(0, "name", "Arthas");
        result.current.updateCharacter(0, "realm", "Tarren Mill");
        result.current.addCharacter(0);
      });
      expect(result.current.characters).toHaveLength(2);
      expect(result.current.characters[0].mode).toBe("added");
      expect(result.current.characters[1].mode).toBe("add");
      expect(result.current.characters[1].name).toBe("");
    });
  });

  describe("removeCharacter", () => {
    it("removes the row at the given index", () => {
      const { result } = renderForm();
      act(() => {
        result.current.updateCharacter(0, "name", "Arthas");
        result.current.addCharacter(0);
      });
      expect(result.current.characters).toHaveLength(2);
      act(() => result.current.removeCharacter(0));
      expect(result.current.characters).toHaveLength(1);
    });

    it("keeps one empty row if the last character is removed", () => {
      const { result } = renderForm();
      act(() => result.current.removeCharacter(0));
      expect(result.current.characters).toHaveLength(1);
      expect(result.current.characters[0].mode).toBe("add");
      expect(result.current.characters[0].name).toBe("");
    });
  });

  describe("canSubmit", () => {
    it("is false when name is empty even with added characters", () => {
      const { result } = renderForm();
      act(() => {
        result.current.updateCharacter(0, "name", "Arthas");
        result.current.addCharacter(0);
      });
      expect(result.current.canSubmit).toBe(false);
    });

    it("is false when name is set but no added characters", () => {
      const { result } = renderForm();
      act(() => result.current.setName("My Ladder"));
      expect(result.current.canSubmit).toBe(false);
    });

    it("is true when name is set and at least one character is added", () => {
      const { result } = renderForm();
      act(() => {
        result.current.setName("My Ladder");
        result.current.updateCharacter(0, "name", "Arthas");
        result.current.addCharacter(0);
      });
      expect(result.current.canSubmit).toBe(true);
    });
  });

  describe("reset on close", () => {
    it("resets form state when open changes to false", async () => {
      const { result, rerender } = renderHook(
        ({ open }) => useCreateViewForm(open, onClose, onCreateView),
        { initialProps: { open: true } },
      );

      act(() => {
        result.current.setName("My Ladder");
        result.current.updateCharacter(0, "name", "Arthas");
        result.current.addCharacter(0);
      });

      expect(result.current.name).toBe("My Ladder");
      expect(result.current.characters).toHaveLength(2);

      rerender({ open: false });

      await waitFor(() => {
        expect(result.current.name).toBe("");
        expect(result.current.characters).toHaveLength(1);
        expect(result.current.characters[0].mode).toBe("add");
      });
    });
  });

  describe("handleSubmit", () => {
    const makeSubmitEvent = () =>
      ({ preventDefault: vi.fn() }) as unknown as React.FormEvent;

    it("calls onCreateView and onClose on success", async () => {
      const { result } = renderForm();
      act(() => {
        result.current.setName("My Ladder");
        result.current.updateCharacter(0, "name", "Arthas");
        result.current.updateCharacter(0, "realm", "Tarren Mill");
        result.current.addCharacter(0);
      });

      await act(async () => result.current.handleSubmit(makeSubmitEvent()));

      expect(onCreateView).toHaveBeenCalledOnce();
      expect(onClose).toHaveBeenCalledOnce();
      expect(result.current.error).toBeNull();
    });

    it("sets error and does not call onClose on API failure", async () => {
      mockUserRequest.mockRejectedValue(new Error("Network error"));
      const { result } = renderForm();
      act(() => {
        result.current.setName("My Ladder");
        result.current.updateCharacter(0, "name", "Arthas");
        result.current.updateCharacter(0, "realm", "Tarren Mill");
        result.current.addCharacter(0);
      });

      await act(async () => result.current.handleSubmit(makeSubmitEvent()));

      expect(result.current.error).toBe("Failed to create ladder. Please try again.");
      expect(onClose).not.toHaveBeenCalled();
      expect(onCreateView).not.toHaveBeenCalled();
    });

    it("promotes the last row if it has name and realm filled in", async () => {
      const { result } = renderForm();
      act(() => {
        result.current.setName("My Ladder");
        result.current.updateCharacter(0, "name", "Arthas");
        result.current.updateCharacter(0, "realm", "Tarren Mill");
      });

      await act(async () => result.current.handleSubmit(makeSubmitEvent()));

      expect(mockUserRequest).toHaveBeenCalledWith(
        "POST",
        "/views",
        expect.objectContaining({
          entities: expect.arrayContaining([
            expect.objectContaining({ name: "Arthas", realm: "Tarren Mill" }),
          ]),
        }),
      );
    });
  });
});
