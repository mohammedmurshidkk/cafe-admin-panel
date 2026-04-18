// src/store/api/marriageApi.ts

import { apiSlice } from './apiSlice';
import { MarriageProfile, MarriageSeeker, InterestRequest, MarriageDashboardStats } from '@/types';

export interface MasterDropdownItem {
  text: string;
  textLocale: string;
  value: string;
}

export interface MastersData {
  districts: MasterDropdownItem[];
  places: Record<string, MasterDropdownItem[]>;
  religions: MasterDropdownItem[];
  sects: Record<string, MasterDropdownItem[]>;
  marital_statuses: MasterDropdownItem[];
  heights: { text: string; value: string }[];
  weights: { text: string; value: string }[];
}

export const marriageApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Masters
    getMasters: builder.query<MastersData, void>({
      query: () => '/marriage/masters',
    }),

    // Dashboard
    getMarriageDashboardStats: builder.query<MarriageDashboardStats, void>({
      query: () => '/marriage/profiles/stats',
      providesTags: ['MarriageStats'],
    }),

    // Profiles
    getProfiles: builder.query<{ profiles: MarriageProfile[] }, { active?: boolean }>({
      query: ({ active = true } = {}) => `/marriage/profiles?active=${active}`,
      providesTags: ['MarriageProfiles'],
    }),
    addProfile: builder.mutation<{ profile: MarriageProfile }, Partial<MarriageProfile>>({
      query: (body) => ({ url: '/marriage/profiles', method: 'POST', body }),
      invalidatesTags: ['MarriageProfiles', 'MarriageStats'],
    }),
    updateProfile: builder.mutation<{ profile: MarriageProfile }, { id: string; data: Partial<MarriageProfile> }>({
      query: ({ id, data }) => ({ url: `/marriage/profiles/${id}`, method: 'PATCH', body: data }),
      invalidatesTags: ['MarriageProfiles', 'MarriageStats'],
    }),
    deleteProfile: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({ url: `/marriage/profiles/${id}`, method: 'DELETE' }),
      invalidatesTags: ['MarriageProfiles', 'MarriageStats'],
    }),

    // Seekers
    getSeekers: builder.query<{ seekers: MarriageSeeker[] }, void>({
      query: () => '/marriage/seekers',
      providesTags: ['MarriageSeekers'],
    }),
    updateSeekerBlock: builder.mutation<{ success: boolean }, { id: string; is_blocked: boolean }>({
      query: ({ id, is_blocked }) => ({ url: `/marriage/seekers/${id}`, method: 'PATCH', body: { is_blocked } }),
      invalidatesTags: ['MarriageSeekers'],
    }),

    // Interest Requests
    getInterestRequests: builder.query<{ requests: InterestRequest[] }, { status?: string }>({
      query: ({ status } = {}) => `/marriage/interests${status ? `?status=${status}` : ''}`,
      providesTags: ['MarriageInterests'],
    }),
    updateInterestRequest: builder.mutation<{ request: InterestRequest }, { id: string; status?: string; admin_note?: string }>({
      query: ({ id, ...data }) => ({ url: `/marriage/interests/${id}`, method: 'PATCH', body: data }),
      invalidatesTags: ['MarriageInterests', 'MarriageStats'],
    }),
  }),
});

export const {
  useGetMastersQuery,
  useGetMarriageDashboardStatsQuery,
  useGetProfilesQuery,
  useAddProfileMutation,
  useUpdateProfileMutation,
  useDeleteProfileMutation,
  useGetSeekersQuery,
  useUpdateSeekerBlockMutation,
  useGetInterestRequestsQuery,
  useUpdateInterestRequestMutation,
} = marriageApi;
