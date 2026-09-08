const API_BASE = '/api';

export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers }
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: 'Ошибка запроса' }));
    throw new Error(payload.error ?? 'Ошибка запроса');
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}

export const apiGet = <T>(path: string) => api<T>(path);
export const apiPost = <T>(path: string, payload: unknown) => api<T>(path, { method: 'POST', body: JSON.stringify(payload) });
export const apiPatch = <T>(path: string, payload: unknown) => api<T>(path, { method: 'PATCH', body: JSON.stringify(payload) });
export const apiDelete = (path: string) => api<void>(path, { method: 'DELETE' });
