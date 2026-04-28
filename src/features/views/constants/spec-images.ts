import { normalizeKey } from "@/features/views/utils.ts";

const modules = import.meta.glob("@/assets/specs/*.webp", {
  eager: true,
  import: "default",
});

export const SPEC_IMAGES: Record<string, string> = Object.fromEntries(
  Object.entries(modules).map(([path, url]) => {
    const key = path.split("/").pop()!.replace(".webp", "");
    return [key, url as string];
  }),
);

export const getSpecImageKey = (className: string, specName: string): string =>
  `${normalizeKey(className)}_${normalizeKey(specName)}`;
