import { ApiError } from '@/shared/api/ApiError.ts';

const VIEW_ID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isViewId = (value: string | undefined): value is string =>
  !!value && VIEW_ID_REGEX.test(value);

export const formatNotFoundMessage = (names: string[], hint: string): string | null =>
  names.length === 0
    ? null
    : `${names.join(', ')} ${names.length === 1 ? 'was' : 'were'} not found. ${hint}`;

export const formatDuplicateMessage = (name: string | null): string | null =>
  name ? `${name} is already in this ladder.` : null;

/** The message for a limit the backend enforces (ladders per user, entities per ladder), or null. */
export const formatLimitError = (err: unknown, noun: string): string | null => {
  if (!(err instanceof ApiError)) return null;
  if (err.code === 'TOO_MANY_VIEWS') return "You've reached the maximum number of ladders.";
  if (err.code === 'TOO_MANY_ENTITIES') return `This ladder has more ${noun} than allowed.`;
  return null;
};
