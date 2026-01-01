import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import type { RootState } from '../store';
import { logout } from '../authSlice';

const API_URL = import.meta.env.VITE_API_URL;

const baseQuery = fetchBaseQuery({
  baseUrl: `${API_URL}/api`,
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as RootState;
    const token = state.auth.token;
    const viewingBusiness = state.auth.viewingBusiness;

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    // When superadmin is viewing a business, send the business ID
    if (viewingBusiness?.id) {
      headers.set('X-Business-Id', viewingBusiness.id);
    }
    return headers;
  },
});

const baseQueryWithAuth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    api.dispatch(logout());
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithAuth,
  tagTypes: ['Orders', 'Sessions', 'ChatSessions', 'Messages', 'Menu', 'Categories', 'Addons', 'Business', 'Dashboard', 'Businesses', 'Notifications', 'NotificationCount', 'CakePricing', 'CakeQuotes'],
  endpoints: () => ({}),
});
