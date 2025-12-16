import { apiSlice } from './apiSlice';
import {
  AddonGroup,
  AddonGroupsResponse,
  Addon,
  CategoryAddonsResponse,
} from '@/types';

export const addonsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAddonGroups: builder.query<AddonGroupsResponse, void>({
      query: () => '/addons/groups',
      providesTags: ['Addons'],
    }),
    createAddonGroup: builder.mutation<{ group: AddonGroup }, { name: string }>(
      {
        query: (data) => ({
          url: '/addons/groups',
          method: 'POST',
          body: data,
        }),
        invalidatesTags: ['Addons'],
      }
    ),
    deleteAddonGroup: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/addon-groups/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Addons'],
    }),
    createAddon: builder.mutation<
      { addon: Addon },
      { name: string; price: number; }
    >({
      query: (data) => ({
        url: '/addons',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Addons'],
    }),
    updateAddon: builder.mutation<
      { addon: Addon },
      {
        id: string;
        name?: string;
        price?: number;
        category?: string;
        description: string;
        is_available?: boolean;
      }
    >({
      query: ({ id, ...data }) => ({
        url: `/addons/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Addons'],
    }),
    deleteAddon: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/addons/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Addons'],
    }),
    linkAddonToCategory: builder.mutation<
      { success: boolean },
      { addon_id: string; category_id: string }
    >({
      query: (data) => ({
        url: '/addons/link',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Addons'],
    }),
    unlinkAddonFromCategory: builder.mutation<
      { success: boolean },
      { addon_id: string; category_id: string }
    >({
      query: (data) => ({
        url: '/addons/unlink',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Addons'],
    }),
    getAddonsByCategory: builder.query<CategoryAddonsResponse, string>({
      query: (categoryId) => `/addons/category/${categoryId}`,
      providesTags: ['Addons'],
    }),
  }),
});

export const {
  useGetAddonGroupsQuery,
  useCreateAddonGroupMutation,
  useDeleteAddonGroupMutation,
  useCreateAddonMutation,
  useUpdateAddonMutation,
  useDeleteAddonMutation,
  useLinkAddonToCategoryMutation,
  useUnlinkAddonFromCategoryMutation,
  useGetAddonsByCategoryQuery,
} = addonsApi;
