import { useRef, useCallback, useEffect } from "react";

type UsePollingOptions<T> = {
  fn: () => Promise<T>;
  shouldContinue: (result: T) => boolean;
  maxAttempts?: number;
  delay?: number;
  initialDelay?: number;
};

export function usePolling<T>({
  fn,
  shouldContinue,
  maxAttempts = 3,
  delay = 5000,
  initialDelay = 0,
}: UsePollingOptions<T>) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attemptsRef = useRef(0);
  const isActiveRef = useRef(false);

  const clear = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const stop = useCallback(() => {
    isActiveRef.current = false;
    clear();
  }, []);

  const poll = useCallback(async () => {
    if (!isActiveRef.current) return;

    try {
      const result = await fn();

      const shouldKeepGoing = shouldContinue(result);
      attemptsRef.current += 1;

      if (shouldKeepGoing && attemptsRef.current < maxAttempts) {
        timeoutRef.current = setTimeout(poll, delay);
      } else {
        stop();
      }
    } catch (error) {
      attemptsRef.current += 1;

      if (attemptsRef.current < maxAttempts) {
        timeoutRef.current = setTimeout(poll, delay);
      } else {
        stop();
      }
    }
  }, [fn, shouldContinue, delay, maxAttempts, stop]);

  const start = useCallback(() => {
    stop(); // reset if already running
    isActiveRef.current = true;
    attemptsRef.current = 0;

    timeoutRef.current = setTimeout(poll, initialDelay);
  }, [poll, initialDelay, stop]);

  useEffect(() => {
    return () => stop(); // cleanup on unmount
  }, [stop]);

  return { start, stop };
}
