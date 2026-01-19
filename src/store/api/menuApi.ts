import { apiSlice } from './apiSlice';
import { MenuItem, MenuResponse, MenuItemFormData } from '@/types';

// Menu PDF Config Types
export interface MenuPdfConfig {
  id: string;
  business_id: string;
  name: string;
  name_local: string;
  slug: string;
  category_ids: string[];
  pdf_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateMenuPdfConfigRequest {
  name: string;
  name_local: string;
  categoryIds: string[];
}

export interface UpdateMenuPdfConfigRequest {
  name?: string;
  name_local?: string;
  categoryIds?: string[];
  is_active?: boolean;
}

// Popular Items Types
export type PopularItemPeriod = 'today' | 'weekly' | 'monthly' | 'all_time';

export interface PopularItem {
  menu_item_id: string;
  item_name: string;
  order_count: number;
  quantity_sold: number;
  revenue: number;
  is_featured: boolean;
  featured_order: number | null;
  trend_percentage?: number;
  menu_item: {
    id: string;
    name: string;
    description: string | null;
    image_url: string | null;
    sizes?: { name: string; price: number }[];
  };
}

export interface PopularItemsResponse {
  items: PopularItem[];
  period: PopularItemPeriod;
  stats: {
    featured_count: number;
    top_selling_count: number;
  };
}

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
    syncMenuPdf: builder.mutation<{ success: boolean; url: string; message: string }, void>({
      query: () => ({
        url: 'admin/menu/pdf/sync',
        method: 'POST',
      }),
    }),
    getMenuPdf: builder.query<{ url: string }, void>({
      query: () => 'admin/menu/pdf',
    }),

    // === Menu PDF Config Endpoints ===
    getMenuPdfConfigs: builder.query<MenuPdfConfig[], void>({
      query: () => 'admin/menu/pdf-configs',
      providesTags: ['MenuPdfConfigs'],
    }),
    createMenuPdfConfig: builder.mutation<MenuPdfConfig, CreateMenuPdfConfigRequest>({
      query: (data) => ({
        url: 'admin/menu/pdf-configs',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['MenuPdfConfigs'],
    }),
    updateMenuPdfConfig: builder.mutation<MenuPdfConfig, { id: string; data: UpdateMenuPdfConfigRequest }>({
      query: ({ id, data }) => ({
        url: `admin/menu/pdf-configs/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['MenuPdfConfigs'],
    }),
    deleteMenuPdfConfig: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `admin/menu/pdf-configs/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['MenuPdfConfigs'],
    }),
    syncMenuPdfConfig: builder.mutation<{ pdf_url: string }, string>({
      query: (id) => ({
        url: `admin/menu/pdf-configs/${id}/sync`,
        method: 'POST',
      }),
      invalidatesTags: ['MenuPdfConfigs'],
    }),

    // === Popular Items Endpoints ===
    getPopularItems: builder.query<PopularItemsResponse, { period?: PopularItemPeriod }>({
      query: ({ period = 'weekly' }) => `admin/popular-items?period=${period}`,
      providesTags: ['Menu'],
    }),
    toggleFeatured: builder.mutation<{ success: boolean; is_featured: boolean }, { itemId: string; is_featured: boolean }>({
      query: ({ itemId, is_featured }) => ({
        url: `admin/menu/${itemId}/featured`,
        method: 'PATCH',
        body: { is_featured },
      }),
      invalidatesTags: ['Menu'],
    }),
    updateFeaturedOrder: builder.mutation<{ success: boolean }, { items: { id: string; featured_order: number }[] }>({
      query: (body) => ({
        url: 'admin/menu/featured/order',
        method: 'PATCH',
        body,
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
  useUploadMenuItemImageMutation,
  useSyncMenuPdfMutation,
  useLazyGetMenuPdfQuery,
  // PDF Config hooks
  useGetMenuPdfConfigsQuery,
  useCreateMenuPdfConfigMutation,
  useUpdateMenuPdfConfigMutation,
  useDeleteMenuPdfConfigMutation,
  useSyncMenuPdfConfigMutation,
  // Popular Items hooks
  useGetPopularItemsQuery,
  useToggleFeaturedMutation,
  useUpdateFeaturedOrderMutation,
} = menuApi;
