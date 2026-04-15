import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '@/app/store';

const STORAGE_KEY_ACCESS = 'auth.accessToken';
const STORAGE_KEY_REFRESH = 'auth.refreshToken';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  username: string | null;
}

function extractUsername(token: string): string | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload.username ?? null;
  } catch {
    return null;
  }
}

const storedAccessToken = localStorage.getItem(STORAGE_KEY_ACCESS);

const initialState: AuthState = {
  accessToken: storedAccessToken,
  refreshToken: localStorage.getItem(STORAGE_KEY_REFRESH),
  username: storedAccessToken ? extractUsername(storedAccessToken) : null,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setTokens: (state, action: PayloadAction<{ accessToken: string; refreshToken: string | null }>) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.username = extractUsername(action.payload.accessToken);
      localStorage.setItem(STORAGE_KEY_ACCESS, action.payload.accessToken);
      if (action.payload.refreshToken) {
        localStorage.setItem(STORAGE_KEY_REFRESH, action.payload.refreshToken);
      } else {
        localStorage.removeItem(STORAGE_KEY_REFRESH);
      }
    },
    setAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
      state.username = extractUsername(action.payload);
      localStorage.setItem(STORAGE_KEY_ACCESS, action.payload);
    },
    clearTokens: (state) => {
      state.accessToken = null;
      state.refreshToken = null;
      state.username = null;
      localStorage.removeItem(STORAGE_KEY_ACCESS);
      localStorage.removeItem(STORAGE_KEY_REFRESH);
    },
  },
});

export const { setTokens, setAccessToken, clearTokens } = authSlice.actions;

export const selectAccessToken = (state: RootState) => state.auth.accessToken;
export const selectRefreshToken = (state: RootState) => state.auth.refreshToken;
export const selectIsAuthenticated = (state: RootState) => state.auth.accessToken !== null;
export const selectUsername = (state: RootState) => state.auth.username;

export default authSlice.reducer;
