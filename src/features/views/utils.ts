export const getClassSlug = (className: string): string =>
  className.toLowerCase().replace(/\s+/g, "-");

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
