import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '@/types';

interface ViewingBusiness {
  id: string;
  name: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  viewingBusiness: ViewingBusiness | null;
}

const getInitialState = (): AuthState => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  const viewingBusinessStr = localStorage.getItem('viewingBusiness');
  const user = userStr ? JSON.parse(userStr) : null;
  const viewingBusiness = viewingBusinessStr ? JSON.parse(viewingBusinessStr) : null;

  return {
    user,
    token,
    isAuthenticated: !!token,
    viewingBusiness,
  };
};

const authSlice = createSlice({
  name: 'auth',
  initialState: getInitialState(),
  reducers: {
    setCredentials: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('user', JSON.stringify(action.payload.user));
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.viewingBusiness = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('viewingBusiness');
    },
    setViewingBusiness: (state, action: PayloadAction<ViewingBusiness>) => {
      state.viewingBusiness = action.payload;
      localStorage.setItem('viewingBusiness', JSON.stringify(action.payload));
    },
    clearViewingBusiness: (state) => {
      state.viewingBusiness = null;
      localStorage.removeItem('viewingBusiness');
    },
  },
});

export const { setCredentials, logout, setViewingBusiness, clearViewingBusiness } = authSlice.actions;
export default authSlice.reducer;
