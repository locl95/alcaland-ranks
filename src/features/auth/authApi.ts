import { store } from '@/app/store';
import { clearTokens, selectAccessToken, setAccessToken } from '@/app/authSlice';
import { ApiError } from '@/shared/api/ApiError';

const BASE_URL = `${import.meta.env.VITE_API_HOST}/api`;

export async function login(
  username: string,
  password: string,
): Promise<{ accessToken: string }> {
  const credentials = btoa(`${username}:${password}`);
  const response = await fetch(`${BASE_URL}/auth`, {
    method: 'POST',
    headers: { Authorization: `Basic ${credentials}` },
    credentials: 'include',
  });

  if (!response.ok) throw new ApiError(response.status, 'Invalid credentials');
  return (await response.json()) as { accessToken: string };
}

export async function bootstrapAuth(): Promise<void> {
  try {
    const response = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!response.ok) return;
    const { accessToken } = (await response.json()) as { accessToken: string };
    store.dispatch(setAccessToken(accessToken));
  } catch {
    // Network error — app will render unauthenticated
  }
}

export async function logout(): Promise<void> {
  const token = selectAccessToken(store.getState());
  if (token) {
    await fetch(`${BASE_URL}/auth`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
      credentials: 'include',
    }).catch(() => {});
  }
  store.dispatch(clearTokens());
}
