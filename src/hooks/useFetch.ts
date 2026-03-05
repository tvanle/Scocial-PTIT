import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../store/slices/authSlice';

interface UseFetchOptions {
  /** Dependencies that trigger refetch (besides accessToken) */
  deps?: any[];
  /** Don't fetch on mount, only when manually called */
  manual?: boolean;
}

interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  onRefresh: () => Promise<void>;
  setData: (data: T | null) => void;
}

export function useFetch<T>(
  fetcher: () => Promise<T>,
  options: UseFetchOptions = {},
): UseFetchResult<T> {
  const { deps = [], manual = false } = options;
  const { accessToken } = useAuthStore();

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!manual);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetcher();
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra');
      console.error('useFetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [fetcher]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      setError(null);
      const result = await fetcher();
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra');
    } finally {
      setRefreshing(false);
    }
  }, [fetcher]);

  useEffect(() => {
    if (!manual && accessToken) {
      setData(null);
      refetch();
    }
  }, [accessToken, ...deps]);

  return { data, loading, refreshing, error, refetch, onRefresh, setData };
}

export default useFetch;
