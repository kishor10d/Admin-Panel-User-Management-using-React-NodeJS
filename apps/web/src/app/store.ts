import { configureStore, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AuthenticatedUser } from '@cias/shared-types';

interface AppState {
  sidebarCollapsed: boolean;
  currentUser: AuthenticatedUser | null;
}

const initialState: AppState = { sidebarCollapsed: false, currentUser: null };

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
    },
    setCurrentUser: (state, action: PayloadAction<AuthenticatedUser | null>) => {
      state.currentUser = action.payload;
    },
  },
});

export const { setSidebarCollapsed, setCurrentUser } = appSlice.actions;
export const store = configureStore({ reducer: { app: appSlice.reducer } });
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
