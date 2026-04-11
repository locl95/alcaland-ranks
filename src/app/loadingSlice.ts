import { createSlice } from '@reduxjs/toolkit';
import { RootState } from "@/app/store";

interface LoadingState {
  loading: boolean;
}

const initialState: LoadingState = {
  loading: false,
}

export const loadingSlice = createSlice({
  name: 'loading',
  initialState,
  reducers: {
    loading: (state) => {
      state.loading = true;
    },
    notLoading: (state) => {
      state.loading = false;
    }
  }
});

export const { loading, notLoading } = loadingSlice.actions;

export const selectLoading = (state: RootState) => state.loading.loading;

export default loadingSlice.reducer;
