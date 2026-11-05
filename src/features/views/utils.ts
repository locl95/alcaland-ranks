const VIEW_ID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isViewId = (value: string | undefined): value is string =>
  !!value && VIEW_ID_REGEX.test(value);

export const formatDuplicateMessage = (name: string | null): string | null =>
  name ? `${name} is already in this ladder.` : null;
