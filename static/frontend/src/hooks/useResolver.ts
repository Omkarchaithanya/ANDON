import { useState, useCallback } from 'react';
import { invoke } from '@forge/bridge';

export interface UseResolverResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  call: (payload?: any) => Promise<T>;
  setData: (data: T | null) => void;
}

/**
 * Custom hook to execute Forge backend resolver calls via @forge/bridge invoke().
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
        const response: any = await invoke(resolverName, payload);
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

