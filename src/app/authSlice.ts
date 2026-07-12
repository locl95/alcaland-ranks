import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '@/app/store';

interface AuthState {
  accessToken: string | null;
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

const initialState: AuthState = {
  accessToken: null,
  username: null,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setTokens: (state, action: PayloadAction<{ accessToken: string }>) => {
      state.accessToken = action.payload.accessToken;
      state.username = extractUsername(action.payload.accessToken);
    },
    setAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
      state.username = extractUsername(action.payload);
    },
    clearTokens: (state) => {
      state.accessToken = null;
      state.username = null;
    },
  },
});

export const { setTokens, setAccessToken, clearTokens } = authSlice.actions;

export const selectAccessToken = (state: RootState) => state.auth.accessToken;
export const selectIsAuthenticated = (state: RootState) => state.auth.accessToken !== null;
export const selectUsername = (state: RootState) => state.auth.username;

export default authSlice.reducer;
