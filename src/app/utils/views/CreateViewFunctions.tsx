import { useState, useCallback } from "react";

interface CharacterRow {
  name: string;
  realm: string;
  region: string;
  mode: "add" | "added";
}

export function useCreateViewForm() {
  const [name, setName] = useState("");

  const [characters, setCharacters] = useState<CharacterRow[]>([
    { name: "", realm: "", region: "", mode: "add" },
  ]);

  const resetForm = useCallback(() => {
    setName("");
    setCharacters([{ name: "", realm: "", region: "", mode: "add" }]);
  }, []);

  const updateCharacter = useCallback(
    (index: number, field: string, value: string) => {
      setCharacters((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], [field]: value };
        return updated;
      });
    },
    [],
  );

  const addCharacter = useCallback((index: number) => {
    setCharacters((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], mode: "added" };

      updated.push({
        name: "",
        realm: "",
        region: "",
        mode: "add",
      });

      return updated;
    });
  }, []);

  const removeCharacter = useCallback((index: number) => {
    setCharacters((prev) => {
      const updated = prev.filter((_, i) => i !== index);

      return updated.length
        ? updated
        : [{ name: "", realm: "", region: "", mode: "add" }];
    });
  }, []);

  const getAddedCharacters = useCallback(() => {
    return characters
      .map((c, i, arr) => {
        if (
          i === arr.length - 1 &&
          c.mode === "add" &&
          c.name.trim() &&
          c.realm.trim() &&
          c.region.trim()
        ) {
          return { ...c, mode: "added" };
        }
        return c;
      })
      .filter((c) => c.mode === "added");
  }, [characters]);

  const canSubmit = useCallback(() => {
    return name.trim() && characters.some((c) => c.mode === "added");
  }, [name, characters]);

  return {
    name,
    setName,
    characters,
    updateCharacter,
    addCharacter,
    removeCharacter,
    resetForm,
    canSubmit,
    getAddedCharacters,
  };
}
