import { apiSlice } from './apiSlice';

// Catalog Types
export interface CatalogSettings {
  catalog_id: string | null;
  commerce_account_id: string | null;
  has_catalog_access_token?: boolean;
}

export interface CatalogSettingsUpdate {
  catalog_id: string | null;
  commerce_account_id: string | null;
  catalog_access_token?: string | null;
}

export interface CatalogSyncResult {
  success: boolean;
  synced_count: number;
  failed_count: number;
  message?: string;
  errors?: Array<{ item_id: string; error: string }>;
}

export interface CatalogItemSyncResult {
  success: boolean;
  retailer_id: string;
  message?: string;
  error?: string;
}

export interface CatalogItemStatus {
  item_id: string;
  retailer_id: string | null;
  sync_status: 'not_synced' | 'pending' | 'synced' | 'failed';
  synced_at: string | null;
}

export interface CatalogStatusResponse {
  items: CatalogItemStatus[];
}

export interface TestConnectionResult {
  success: boolean;
  error?: string;
}

export const catalogApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Get catalog settings
    getCatalogSettings: builder.query<CatalogSettings, void>({
      query: () => 'admin/catalog/settings',
      providesTags: ['Catalog'],
    }),

    // Update catalog settings
    updateCatalogSettings: builder.mutation<{ success: boolean; message: string }, CatalogSettingsUpdate>({
      query: (settings) => ({
        url: 'admin/catalog/settings',
        method: 'PUT',
        body: settings,
      }),
      invalidatesTags: ['Catalog'],
    }),

    // Test catalog connection
    testCatalogConnection: builder.mutation<TestConnectionResult, void>({
      query: () => ({
        url: 'admin/catalog/test-connection',
        method: 'POST',
      }),
    }),

    // Sync items to catalog (optionally specify which items)
    syncToCatalog: builder.mutation<CatalogSyncResult, { itemIds?: string[] } | void>({
      query: (body) => ({
        url: 'admin/catalog/sync',
        method: 'POST',
        body: body || {},
      }),
      invalidatesTags: ['Menu', 'Catalog'],
    }),

    // Sync single item to catalog
    syncItemToCatalog: builder.mutation<CatalogItemSyncResult, string>({
      query: (itemId) => ({
        url: `admin/catalog/sync/${itemId}`,
        method: 'POST',
      }),
      invalidatesTags: ['Menu'],
    }),

    // Get catalog sync status for all items
    getCatalogStatus: builder.query<CatalogStatusResponse, void>({
      query: () => 'admin/catalog/status',
      providesTags: ['Catalog'],
    }),

    // Remove item from catalog
    removeFromCatalog: builder.mutation<{ success: boolean; message: string }, string>({
      query: (itemId) => ({
        url: `admin/catalog/${itemId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Menu', 'Catalog'],
    }),
  }),
});

export const {
  useGetCatalogSettingsQuery,
  useUpdateCatalogSettingsMutation,
  useTestCatalogConnectionMutation,
  useSyncToCatalogMutation,
  useSyncItemToCatalogMutation,
  useGetCatalogStatusQuery,
  useRemoveFromCatalogMutation,
} = catalogApi;
