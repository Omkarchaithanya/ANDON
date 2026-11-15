import { useState, useCallback } from 'react';
import { invoke } from '@forge/bridge';

export const RESOLVER_TIMEOUT_MS = 15000;

/**
 * Executes a Forge backend resolver call wrapped in a strict 15s timeout race.
 */
export async function invokeWithTimeout<T>(resolverName: string, payload?: any): Promise<T> {
  let timerId: any;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timerId = setTimeout(() => {
      reject(new Error(`Resolver "${resolverName}" exceeded ${RESOLVER_TIMEOUT_MS}ms platform SLA timeout.`));
    }, RESOLVER_TIMEOUT_MS);
  });

  try {
    return await Promise.race([
      invoke<T>(resolverName, payload),
      timeoutPromise,
    ]);
  } finally {
    clearTimeout(timerId);
  }
}

export interface UseResolverResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  call: (payload?: any) => Promise<T>;
  setData: (data: T | null) => void;
}

/**
 * Custom hook to execute Forge backend resolver calls via invokeWithTimeout().
 */
export function useResolver<T>(resolverName: string): UseResolverResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const call = useCallback(
    async (payload?: any): Promise<T> => {
      setLoading(true);
      setError(null);
      try {
        const response: any = await invokeWithTimeout<T>(resolverName, payload);
        setData(response);
        return response as T;
      } catch (err: any) {
        const message = err?.message || typeof err === 'string' ? err : 'Unknown resolver error';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [resolverName]
  );

  return { data, loading, error, call, setData };
}
