export const normalizeKey = (s: string): string =>
  s.toLowerCase().replace(/\s+/g, "");

export const getClassSlug = (className: string): string =>
  className.toLowerCase().replace(/\s+/g, "-");

export const haveSameCharacters = <T extends { id: number }>(
  a: T[],
  b: T[],
): boolean => {
  if (a.length !== b.length) return false;
  const idsA = new Set(a.map((c) => c.id));
  return b.every((c) => idsA.has(c.id));
};

type ExternalService = "raiderio" | "summoned";

const SERVICE_BASE_URLS: Record<ExternalService, string> = {
  raiderio: "https://raider.io/characters",
  summoned: "https://summoned.io",
};

export const openExternalProfile = (
  character: { name: string; realm: string; region: string },
  service: ExternalService,
): void => {
  const realm = character.realm.replace(/\s+/g, "-");
  const name = character.name.toLowerCase();
  const region = character.region.toLowerCase();
  window.open(
    `${SERVICE_BASE_URLS[service]}/${region}/${realm}/${name}`,
    "_blank",
    "noopener,noreferrer",
  );
};

export const getScoreClass = (score: number): string => {
  if (score < 300) return "score-grey";
  if (score < 1100) return "score-green";
  if (score < 1800) return "score-blue";
  if (score < 3000) return "score-purple";
  return "score-orange";
};

export const getRankChange = (current: number, previous?: number): number | null => {
  if (previous === undefined) return null;
  return previous - current;
};

export const formatRankChange = (change: number): string => {
  const formatted = Math.round(Math.abs(change)).toLocaleString();
  return change > 0 ? `+${formatted}` : `-${formatted}`;
};
