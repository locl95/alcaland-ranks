export const hasOpenPopupInside = (panel: HTMLElement | null): boolean =>
  panel?.querySelector('[role="listbox"]') != null;
