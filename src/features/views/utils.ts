import { EU_REALMS } from '@/features/views/constants/euRealms.ts';
import { NA_REALMS } from '@/features/views/constants/naRealms.ts';

export const normalizeKey = (s: string): string => s.toLowerCase().replace(/\s+/g, '');

export const formatNotFoundMessage = (names: string[]): string | null =>
  names.length === 0
    ? null
    : `${names.join(', ')} ${names.length === 1 ? 'was' : 'were'} not found. Check the name, realm and region.`;

export const formatDuplicateMessage = (name: string | null): string | null =>
  name ? `${name} is already in this ladder.` : null;

export const toRealmSlug = (realm: string, region: string): string => {
  const realms = region.toLowerCase() === 'us' ? NA_REALMS : EU_REALMS;
  const match = realms.find((r) => r.slug === realm || r.label === realm);
  return match?.slug ?? realm.trim().toLowerCase().replace(/\s+/g, '-');
};

export const getClassSlug = (className: string): string =>
  className.toLowerCase().replace(/\s+/g, '-');

export const haveSameCharacters = <T extends { id: number }>(a: T[], b: T[]): boolean => {
  if (a.length !== b.length) return false;
  const idsA = new Set(a.map((c) => c.id));
  return b.every((c) => idsA.has(c.id));
};

type ExternalService = 'raiderio' | 'summoned';

const SERVICE_BASE_URLS: Record<ExternalService, string> = {
  raiderio: 'https://raider.io/characters',
  summoned: 'https://summoned.io',
};

export const openExternalProfile = (
  character: { name: string; realm: string; region: string },
  service: ExternalService,
): void => {
  const realm = character.realm.replace(/\s+/g, '-');
  const name = character.name.toLowerCase();
  const region = character.region.toLowerCase();
  window.open(
    `${SERVICE_BASE_URLS[service]}/${region}/${realm}/${name}`,
    '_blank',
    'noopener,noreferrer',
  );
};

export type ScoreTier = 'grey' | 'green' | 'blue' | 'purple' | 'orange';

export const getScoreTier = (score: number): ScoreTier => {
  if (score < 300) return 'grey';
  if (score < 1100) return 'green';
  if (score < 1800) return 'blue';
  if (score < 3000) return 'purple';
  return 'orange';
};

export const getScoreClass = (score: number): string => `score-${getScoreTier(score)}`;

export const getRankChange = (current: number, previous?: number): number | null => {
  if (previous === undefined) return null;
  return previous - current;
};

export const formatRankChange = (change: number): string => {
  const formatted = Math.round(Math.abs(change)).toLocaleString();
  return change > 0 ? `+${formatted}` : `-${formatted}`;
};

export function formatClearTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function formatTimeDelta(clearMs: number, parMs: number): { text: string; timed: boolean } {
  const diffMs = Math.abs(parMs - clearMs);
  const totalSeconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const sign = clearMs <= parMs ? '-' : '+';
  const text = `${sign}${minutes}:${String(seconds).padStart(2, '0')}`;
  return { text, timed: clearMs <= parMs };
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}
