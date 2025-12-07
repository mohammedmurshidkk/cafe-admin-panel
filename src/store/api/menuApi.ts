import { apiSlice } from './apiSlice';
import { MenuItem, MenuResponse, MenuItemFormData } from '@/types';

export const menuApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMenuItems: builder.query<MenuResponse, { category?: string }>({
      query: ({ category }) => {
        const params = new URLSearchParams();
        if (category) params.append('category', category);
        return `/menu?${params.toString()}`;
      },
      providesTags: ['Menu'],
    }),
    createMenuItem: builder.mutation<{ item: MenuItem }, MenuItemFormData>({
      query: (item) => ({
        url: '/menu',
        method: 'POST',
        body: item,
      }),
      invalidatesTags: ['Menu'],
    }),
    updateMenuItem: builder.mutation<{ item: MenuItem }, { itemId: string; data: Partial<MenuItemFormData> }>({
      query: ({ itemId, data }) => ({
        url: `/menu/${itemId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Menu'],
    }),
    deleteMenuItem: builder.mutation<{ success: boolean }, string>({
      query: (itemId) => ({
        url: `/menu/${itemId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Menu'],
    }),
    uploadMenuItemImage: builder.mutation<{ image_url: string }, { itemId: string; formData: FormData }>({
      query: ({ itemId, formData }) => ({
        url: `/menu/${itemId}/image`,
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Menu'],
    }),
  }),
});

export const { 
  useGetMenuItemsQuery, 
  useCreateMenuItemMutation, 
  useUpdateMenuItemMutation, 
  useDeleteMenuItemMutation,
  useUploadMenuItemImageMutation 
} = menuApi;
