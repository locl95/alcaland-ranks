import { store } from '@/app/store';
import {
  clearTokens,
  selectAccessToken,
  selectRefreshToken,
  setAccessToken,
} from '@/app/authSlice';
import { ApiError } from '@/shared/api/ApiError';

const BASE_URL = `${import.meta.env.VITE_API_HOST}/api`;

export async function login(
  username: string,
  password: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  const credentials = btoa(`${username}:${password}`);
  const response = await fetch(`${BASE_URL}/auth`, {
    method: 'POST',
    headers: { Authorization: `Basic ${credentials}` },
  });

  if (!response.ok) throw new ApiError(response.status, 'Invalid credentials');
  return (await response.json()) as { accessToken: string; refreshToken: string };
}

export async function bootstrapAuth(): Promise<void> {
  const refreshToken = selectRefreshToken(store.getState());
  if (!refreshToken) return;

  try {
    const response = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${refreshToken}` },
    });
    if (!response.ok) {
      store.dispatch(clearTokens());
      return;
    }
    const { accessToken } = (await response.json()) as { accessToken: string };
    store.dispatch(setAccessToken(accessToken));
  } catch {}
}

export async function logout(): Promise<void> {
  const token = selectAccessToken(store.getState());
  if (token) {
    await fetch(`${BASE_URL}/auth`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  }
  store.dispatch(clearTokens());
}
