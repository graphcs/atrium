import { useState, useCallback } from 'react';

const BASE = `${import.meta.env.VITE_API_URL || ''}/api`;

export function useApi() {
  const [loading, setLoading] = useState(false);

  const request = useCallback(async <T>(path: string, options?: RequestInit): Promise<T> => {
    setLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (options?.body) {
        headers['Content-Type'] = 'application/json';
      }
      const res = await fetch(`${BASE}${path}`, {
        headers,
        ...options,
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      return await res.json();
    } finally {
      setLoading(false);
    }
  }, []);

  const get = useCallback(<T>(path: string) => request<T>(path), [request]);
  const post = useCallback(<T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }), [request]);
  const patch = useCallback(<T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }), [request]);
  const del = useCallback(<T>(path: string) =>
    request<T>(path, { method: 'DELETE' }), [request]);

  return { get, post, patch, del, loading };
}
