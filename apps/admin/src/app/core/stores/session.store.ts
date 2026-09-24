import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';

export type SessionUser = {
  id: string;
  name: string;
  role: 'superadmin' | 'admin' | 'vendor' | 'vendor_admin';
};

type SessionState = {
  user: SessionUser | null;
  isAuthenticated: boolean;
};

const initialState: SessionState = {
  user: null,
  isAuthenticated: false,
};

export const SessionStore = signalStore(
  { protectedState: false },
  withState<SessionState>(initialState),
  withMethods((store) => ({
    login(user: SessionUser) {
      patchState(store, { user, isAuthenticated: true });
    },
    logout() {
      patchState(store, { user: null, isAuthenticated: false });
    },
  })),
);
