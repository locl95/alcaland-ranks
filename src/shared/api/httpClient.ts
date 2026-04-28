import { store } from '@/app/store';
import { setAccessToken, clearTokens, selectRefreshToken, selectAccessToken } from '@/app/authSlice';
import { ApiError } from '@/shared/api/ApiError';

const BASE_URL = `${import.meta.env.VITE_API_HOST}/api`;
const SERVICE_TOKEN = import.meta.env.VITE_SERVICE_TOKEN;

// ---------------------------------------------------------------------------
// Service token — read-only operations, no refresh needed
// ---------------------------------------------------------------------------

export async function serviceGet<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SERVICE_TOKEN}`,
    },
  });

  if (!response.ok) throw new ApiError(response.status, response.statusText);
  return response.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// User token — write operations, with 401 → refresh retry
// ---------------------------------------------------------------------------

let isRefreshing = false;
let refreshQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

async function refreshAccessToken(): Promise<string> {
  const refreshToken = selectRefreshToken(store.getState());
  if (!refreshToken) {
    store.dispatch(clearTokens());
    throw new ApiError(401, 'Session expired');
  }

  const response = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${refreshToken}` },
  });

  if (!response.ok) {
    store.dispatch(clearTokens());
    throw new ApiError(response.status, 'Session expired');
  }

  const data = await response.json() as { accessToken: string };
  store.dispatch(setAccessToken(data.accessToken));
  return data.accessToken;
}

async function sendUserRequest(method: string, endpoint: string, body?: object): Promise<Response> {
  const token = selectAccessToken(store.getState());
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401) {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const newToken = await refreshAccessToken();
        refreshQueue.forEach(({ resolve }) => resolve(newToken));
        refreshQueue = [];
      } catch (error) {
        refreshQueue.forEach(({ reject }) => reject(error));
        refreshQueue = [];
        throw error;
      } finally {
        isRefreshing = false;
      }
    } else {
      await new Promise<string>((resolve, reject) => refreshQueue.push({ resolve, reject }));
    }

    const newToken = selectAccessToken(store.getState());
    const retryResponse = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(newToken && { Authorization: `Bearer ${newToken}` }),
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!retryResponse.ok) throw new ApiError(retryResponse.status, retryResponse.statusText);
    return retryResponse;
  }

  if (!response.ok) throw new ApiError(response.status, response.statusText);
  return response;
}

export async function userRequest<T>(method: string, endpoint: string, body?: object): Promise<T> {
  const response = await sendUserRequest(method, endpoint, body);
  return response.json() as Promise<T>;
}

export async function userRequestVoid(method: string, endpoint: string, body?: object): Promise<void> {
  await sendUserRequest(method, endpoint, body);
}
