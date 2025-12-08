import { apiSlice } from './apiSlice';
import { MenuItem, MenuResponse, MenuItemFormData } from '@/types';

export const menuApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMenuItems: builder.query<MenuResponse, { category?: string }>({
      query: ({ category }) => {
        const params = new URLSearchParams();
        if (category) params.append('category', category);
        return `admin/menu?${params.toString()}`;
      },
      providesTags: ['Menu'],
    }),
    createMenuItem: builder.mutation<{ item: MenuItem }, Record<string, unknown>>({
      query: (item) => ({
        url: 'admin/menu',
        method: 'POST',
        body: item,
      }),
      invalidatesTags: ['Menu'],
    }),
    updateMenuItem: builder.mutation<{ item: MenuItem }, { itemId: string; data: Partial<MenuItemFormData> }>({
      query: ({ itemId, data }) => ({
        url: `admin/menu/${itemId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Menu'],
    }),
    deleteMenuItem: builder.mutation<{ success: boolean }, string>({
      query: (itemId) => ({
        url: `admin/menu/${itemId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Menu'],
    }),
    uploadMenuItemImage: builder.mutation<{ image_url: string }, { itemId: string; formData: FormData }>({
      query: ({ itemId, formData }) => ({
        url: `admin/menu/${itemId}/image`,
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
