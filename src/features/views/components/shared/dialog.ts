/**
 * Radix listens for Escape in the capture phase on `document`, so a popup
 * nested inside a dialog cannot stop the event from reaching the dialog first.
 * The dialog has to ask instead: while a nested list is open, Escape belongs to
 * that list, and only a second press closes the dialog.
 */
export const hasOpenPopupInside = (): boolean =>
  document.querySelector('[role="listbox"]') !== null;
