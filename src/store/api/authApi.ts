import { apiSlice } from './apiSlice';
import { LoginRequest, LoginResponse } from '@/types';

interface ChangePasswordRequest {
  email: string;
  currentPassword: string;
  newPassword: string;
}

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    changePasswordPublic: builder.mutation<void, ChangePasswordRequest>({
      query: (data) => ({
        url: '/auth/change-password-public',
        method: 'POST',
        body: data,
      }),
    }),
  }),
});

export const { useLoginMutation, useChangePasswordPublicMutation } = authApi;
