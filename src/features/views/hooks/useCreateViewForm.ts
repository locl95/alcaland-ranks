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

  useEffect(() => {
    if (!open) {
      setName("");
      setCharacters([EMPTY_ROW]);
      setError(null);
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

  const canSubmit = !!name.trim() && characters.some((c) => c.mode === "added");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const addedCharacters = characters
      .map((c, i, arr) =>
        i === arr.length - 1 && c.mode === "add" && c.name.trim() && c.realm.trim()
          ? { ...c, mode: "added" as const }
          : c,
      )
      .filter((c) => c.mode === "added");

    try {
      await userRequest("POST", "/views", {
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
        id: "",
        simpleView: {
          id: "",
          name,
          owner: "",
          published: false,
          entitiesIds: [],
          game: "WOW",
          featured: false,
          extraArguments: null,
        },
        isSynced: false,
      });

      onClose();
    } catch {
      setError("Failed to create ladder. Please try again.");
    }
  };

  return {
    name,
    setName,
    characters,
    canSubmit,
    error,
    updateCharacter,
    addCharacter,
    removeCharacter,
    handleSubmit,
  };
}
