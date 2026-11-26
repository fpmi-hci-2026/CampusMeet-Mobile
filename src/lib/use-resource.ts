import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api, isNetworkError } from './api';
import { cache } from './storage';

interface State<T> {
  data: T | undefined;
  error: Error | null;
  loading: boolean;
  refreshing: boolean;
  /** true when showing cached data because the network is unavailable */
  offline: boolean;
  savedAt: number | null;
}

/**
 * Stale-while-revalidate for one GET endpoint with an AsyncStorage fallback:
 * cached data shows instantly, fresh data replaces it, and on network failure the cache stays.
 */
export function useResource<T>(path: string | null, { refetchOnFocus = true } = {}) {
  const [state, setState] = useState<State<T>>({ data: undefined, error: null, loading: !!path, refreshing: false, offline: false, savedAt: null });
  const alive = useRef(true);

  const load = useCallback(
    async (mode: 'initial' | 'refresh' | 'silent') => {
      if (!path) return;
      if (mode === 'refresh') setState((s) => ({ ...s, refreshing: true }));
      try {
        const data = await api.get<T>(path);
        await cache.write(path, data);
        if (alive.current) setState({ data, error: null, loading: false, refreshing: false, offline: false, savedAt: Date.now() });
      } catch (error) {
        const cached = await cache.read<T>(path);
        if (!alive.current) return;
        if (isNetworkError(error) && cached) {
          setState({ data: cached.data, error: null, loading: false, refreshing: false, offline: true, savedAt: cached.savedAt });
        } else {
          setState((s) => ({ ...s, error: error as Error, loading: false, refreshing: false, offline: isNetworkError(error) }));
        }
      }
    },
    [path],
  );

  useEffect(() => {
    alive.current = true;
    if (!path) {
      setState({ data: undefined, error: null, loading: false, refreshing: false, offline: false, savedAt: null });
      return;
    }
    cache.read<T>(path).then((cached) => {
      if (cached && alive.current) setState((s) => (s.data ? s : { ...s, data: cached.data, savedAt: cached.savedAt, loading: false }));
    });
    load('initial');
    return () => {
      alive.current = false;
    };
  }, [path, load]);

  const first = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (first.current) {
        first.current = false;
        return;
      }
      if (refetchOnFocus) load('silent');
    }, [load, refetchOnFocus]),
  );

  return { ...state, refresh: () => load('refresh'), reload: () => load('silent'), setData: (data: T) => setState((s) => ({ ...s, data })) };
}
