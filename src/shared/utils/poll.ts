async function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });
}

export async function poll<T>(
  fetchFn: (signal?: AbortSignal) => Promise<T>,
  isDone: (result: T) => boolean,
  intervalMs: number,
  maxAttempts: number,
  signal?: AbortSignal,
): Promise<T | null> {
  for (let i = 0; i < maxAttempts; i++) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    const result = await fetchFn(signal);
    if (isDone(result)) return result;
    await sleep(intervalMs, signal);
  }
  return null;
}
