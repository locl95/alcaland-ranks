import { useEffect, useState } from "react";
import { View } from "@/features/views/model/view.ts";
import { userRequest } from "@/shared/api/httpClient.ts";

export interface CharacterRow {
  name: string;
  realm: string;
  region: string;
  mode: "add" | "added";
}

const EMPTY_ROW: CharacterRow = { name: "", realm: "", region: "eu", mode: "add" };

export function useCreateViewForm(
  open: boolean,
  onClose: () => void,
  onCreateView: (view: View) => void,
) {
  const [name, setName] = useState("");
  const [characters, setCharacters] = useState<CharacterRow[]>([EMPTY_ROW]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setName("");
      setCharacters([EMPTY_ROW]);
      setError(null);
      setIsSubmitting(false);
    }
  }, [open]);

  const updateCharacter = (index: number, field: string, value: string) => {
    setCharacters((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addCharacter = (index: number) => {
    setCharacters((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], mode: "added" };
      updated.push({ ...EMPTY_ROW });
      return updated;
    });
  };

  const removeCharacter = (index: number) => {
    setCharacters((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      return updated.length ? updated : [{ ...EMPTY_ROW }];
    });
  };

  const canSubmit = !isSubmitting && !!name.trim() && characters.some((c) => c.mode === "added");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const addedCharacters = characters
      .map((c, i, arr) =>
        i === arr.length - 1 && c.mode === "add" && c.name.trim() && c.realm.trim()
          ? { ...c, mode: "added" as const }
          : c,
      )
      .filter((c) => c.mode === "added");

    try {
      const { id: operationId } = await userRequest<{ id: string }>("POST", "/views", {
        name,
        entities: addedCharacters.map((c) => ({
          name: c.name,
          region: c.region,
          realm: c.realm,
          type: "com.kos.entities.domain.WowEntityRequest",
        })),
        published: true,
        featured: false,
        game: "WOW",
      });

      onCreateView({
        id: operationId,
        simpleView: {
          id: operationId,
          name,
          owner: "",
          published: true,
          entitiesIds: addedCharacters.map((_, i) => i),
          game: "WOW",
          featured: false,
          extraArguments: null,
        },
        status: "pending",
      });

      onClose();
    } catch {
      setError("Failed to create ladder. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    name,
    setName,
    characters,
    canSubmit,
    error,
    isSubmitting,
    updateCharacter,
    addCharacter,
    removeCharacter,
    handleSubmit,
  };
}
