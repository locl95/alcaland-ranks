import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../../app/store";
import { LoginState } from "./types";

const initialState: LoginState = {
  accessToken: undefined,
  refreshToken: undefined,
  user: undefined,
  roles: undefined,
};

export const loginSlice = createSlice({
  name: "login",
  initialState,
  reducers: {
    update: (state, action: PayloadAction<LoginState>) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.user = action.payload.user;
      state.roles = action.payload.roles;
    },
    updateAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
    },
    updateRoles: (state, action: PayloadAction<string[]>) => {
      state.roles = action.payload;
    },
  },
});

export const { update, updateAccessToken, updateRoles } = loginSlice.actions;

export const selectAccessAuthorization = (state: RootState) =>
  state.login.accessToken;
export const selectRefreshAuthorization = (state: RootState) =>
  state.login.refreshToken;
export const selectUser = (state: RootState) => state.login.user;
export const selectUserRoles = (state: RootState) => state.login.roles;

export default loginSlice.reducer;
