import { apiSlice } from './apiSlice';

// Types
export interface WeightPricing {
  id: string;
  weight_grams: number;
  base_price: number;
  is_active: boolean;
}

export interface FlavorSize {
  name: string;
  price: number;
  is_base: boolean;
}

export interface FlavorPricing {
  id: string;
  flavor_name: string;
  sizes: FlavorSize[];
  is_active: boolean;
}

export interface DesignElement {
  id: string;
  element_key: string;
  element_label: string;
  price: number;
  price_type: 'fixed' | 'per_unit';
  is_active: boolean;
  sort_order: number;
}

export interface CakePricingConfig {
  enabled: boolean;
  auto_send: boolean;
  quote_expiry_hours: number;
  weights: WeightPricing[];
  flavors: FlavorPricing[];
  elements: DesignElement[];
}

export interface CakeQuoteAIAnalysis {
  price_breakdown: any;
  detected_elements: Array<{
    unit_price: any;
    element_key: string;
    element_label: string;
    quantity: number;
    confidence: number;
    price: number;
  }>;
  complexity_level: string;
  confidence_score: number;
  base_price: number;
  flavor_price: number;
  total_design_cost: number;
}

export interface CakeQuote {
  id: string;
  business_id: string;
  session_id: string | null;
  customer_id: string | null;
  customer: {
    id: string;
    name: string;
    phone: string;
  };
  image_url: string | null;
  customer_weight?: string | null;
  customer_flavor?: string | null;
  ai_analysis: CakeQuoteAIAnalysis | null;
  suggested_price: number | null;
  suggested_message: string | null;
  status: 'pending' | 'sent' | 'accepted' | 'cancelled' | 'expired';
  admin_final_message: string | null;
  admin_final_price: number | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  // New fields for time confirmation flow
  accepted_at: string | null;
  requested_delivery_time: string | null;
  requested_fulfillment_type: 'delivery' | 'takeaway' | null;
  time_confirmed: boolean;
  time_confirmed_at: string | null;
  created_at: string;
  expires_at: string;
}

export interface PendingCakeQuote {
  id: string;
  type: 'price_confirmation' | 'time_confirmation';
  // Price confirmation fields
  suggested_message?: string;
  suggested_price?: number;
  image_url?: string;
  customer_weight?: string;
  ai_analysis?: CakeQuoteAIAnalysis;
  // Time confirmation fields
  requested_delivery_time?: string;
  requested_fulfillment_type?: 'delivery' | 'takeaway';
}

// API Response types
interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    total: number;
  };
}

// Request types
interface CreateWeightRequest {
  weight_grams: number;
  base_price: number;
}

interface UpdateWeightRequest {
  id: string;
  base_price?: number;
  is_active?: boolean;
}

interface CreateFlavorRequest {
  flavor_name: string;
  sizes: FlavorSize[];
}

interface UpdateFlavorRequest {
  id: string;
  flavor_name?: string;
  sizes?: FlavorSize[];
  is_active?: boolean;
}

interface CreateElementRequest {
  element_key: string;
  element_label: string;
  price: number;
  price_type: 'fixed' | 'per_unit';
}

interface UpdateElementRequest {
  id: string;
  element_label?: string;
  price?: number;
  price_type?: 'fixed' | 'per_unit';
  is_active?: boolean;
  sort_order?: number;
}

interface UpdateConfigRequest {
  enabled?: boolean;
  auto_send?: boolean;
  quote_expiry_hours?: number;
}

interface SendQuoteRequest {
  final_message?: string;
  final_price?: number;
}

interface CancelQuoteRequest {
  reason?: string;
}

interface ListQuotesParams {
  status?: 'pending' | 'sent' | 'cancelled' | 'expired';
  page?: number;
  limit?: number;
}

export const cakePricingApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Config
    getCakePricingConfig: builder.query<ApiResponse<CakePricingConfig>, void>({
      query: () => '/admin/cake-pricing/config',
      providesTags: ['CakePricing'],
    }),

    updateCakePricingConfig: builder.mutation<ApiResponse<CakePricingConfig>, UpdateConfigRequest>({
      query: (data) => ({
        url: '/admin/cake-pricing/config',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['CakePricing'],
    }),

    // Weights
    getWeights: builder.query<ApiResponse<WeightPricing[]>, void>({
      query: () => '/admin/cake-pricing/weights',
      providesTags: ['CakePricing'],
    }),

    createWeight: builder.mutation<ApiResponse<WeightPricing>, CreateWeightRequest>({
      query: (data) => ({
        url: '/admin/cake-pricing/weights',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['CakePricing'],
    }),

    updateWeight: builder.mutation<ApiResponse<WeightPricing>, UpdateWeightRequest>({
      query: ({ id, ...data }) => ({
        url: `/admin/cake-pricing/weights/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['CakePricing'],
    }),

    deleteWeight: builder.mutation<ApiResponse<{ success: boolean }>, string>({
      query: (id) => ({
        url: `/admin/cake-pricing/weights/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['CakePricing'],
    }),

    // Flavors
    getFlavors: builder.query<ApiResponse<FlavorPricing[]>, void>({
      query: () => '/admin/cake-pricing/flavors',
      providesTags: ['CakePricing'],
    }),

    createFlavor: builder.mutation<ApiResponse<FlavorPricing>, CreateFlavorRequest>({
      query: (data) => ({
        url: '/admin/cake-pricing/flavors',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['CakePricing'],
    }),

    updateFlavor: builder.mutation<ApiResponse<FlavorPricing>, UpdateFlavorRequest>({
      query: ({ id, ...data }) => ({
        url: `/admin/cake-pricing/flavors/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['CakePricing'],
    }),

    deleteFlavor: builder.mutation<ApiResponse<{ success: boolean }>, string>({
      query: (id) => ({
        url: `/admin/cake-pricing/flavors/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['CakePricing'],
    }),

    // Design Elements
    getDesignElements: builder.query<ApiResponse<DesignElement[]>, void>({
      query: () => '/admin/cake-pricing/elements',
      providesTags: ['CakePricing'],
    }),

    createDesignElement: builder.mutation<ApiResponse<DesignElement>, CreateElementRequest>({
      query: (data) => ({
        url: '/admin/cake-pricing/elements',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['CakePricing'],
    }),

    updateDesignElement: builder.mutation<ApiResponse<DesignElement>, UpdateElementRequest>({
      query: ({ id, ...data }) => ({
        url: `/admin/cake-pricing/elements/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['CakePricing'],
    }),

    deleteDesignElement: builder.mutation<ApiResponse<{ success: boolean }>, string>({
      query: (id) => ({
        url: `/admin/cake-pricing/elements/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['CakePricing'],
    }),

    seedDesignElements: builder.mutation<ApiResponse<DesignElement[]>, void>({
      query: () => ({
        url: '/admin/cake-pricing/elements/seed',
        method: 'POST',
      }),
      invalidatesTags: ['CakePricing'],
    }),

    // Quotes
    getCakeQuotes: builder.query<PaginatedResponse<CakeQuote>, ListQuotesParams>({
      query: (params) => ({
        url: '/admin/cake-quotes',
        params,
      }),
      providesTags: ['CakeQuotes'],
    }),

    getCakeQuote: builder.query<ApiResponse<CakeQuote>, string>({
      query: (id) => `/admin/cake-quotes/${id}`,
      providesTags: ['CakeQuotes'],
    }),

    getPendingQuote: builder.query<ApiResponse<PendingCakeQuote | null>, string>({
      query: (sessionId) => `/admin/cake-quotes/session/${sessionId}/pending`,
      providesTags: (_result, _error, sessionId) => [{ type: 'CakeQuotes', id: sessionId }],
    }),

    sendCakeQuote: builder.mutation<ApiResponse<{ success: boolean }>, { id: string } & SendQuoteRequest>({
      query: ({ id, ...data }) => ({
        url: `/admin/cake-quotes/${id}/send`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['CakeQuotes'],
    }),

    cancelCakeQuote: builder.mutation<ApiResponse<{ success: boolean }>, { id: string } & CancelQuoteRequest>({
      query: ({ id, ...data }) => ({
        url: `/admin/cake-quotes/${id}/cancel`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['CakeQuotes'],
    }),

    confirmCakeQuoteTime: builder.mutation<ApiResponse<CakeQuote>, string>({
      query: (id) => ({
        url: `/admin/cake-quotes/${id}/confirm-time`,
        method: 'POST',
      }),
      invalidatesTags: ['CakeQuotes'],
    }),

    rejectCakeQuoteTime: builder.mutation<ApiResponse<CakeQuote>, { id: string; reason?: string }>({
      query: ({ id, reason }) => ({
        url: `/admin/cake-quotes/${id}/reject-time`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: ['CakeQuotes'],
    }),

    uploadFlavors: builder.mutation<ApiResponse<{ flavorsCreated: number; flavorsUpdated: number }>, { file: File; replace?: boolean }>({
      query: ({ file, replace }) => {
        const formData = new FormData();
        formData.append('flavors', file);
        return {
          url: `/admin/cake-pricing/flavors/upload${replace ? '?replace=true' : ''}`,
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: ['CakePricing'],
    }),
  }),
});

export const {
  // Config
  useGetCakePricingConfigQuery,
  useUpdateCakePricingConfigMutation,
  // Weights
  useGetWeightsQuery,
  useCreateWeightMutation,
  useUpdateWeightMutation,
  useDeleteWeightMutation,
  // Flavors
  useGetFlavorsQuery,
  useCreateFlavorMutation,
  useUpdateFlavorMutation,
  useDeleteFlavorMutation,
  // Design Elements
  useGetDesignElementsQuery,
  useCreateDesignElementMutation,
  useUpdateDesignElementMutation,
  useDeleteDesignElementMutation,
  useSeedDesignElementsMutation,
  // Quotes
  useGetCakeQuotesQuery,
  useGetCakeQuoteQuery,
  useGetPendingQuoteQuery,
  useSendCakeQuoteMutation,
  useCancelCakeQuoteMutation,
  useConfirmCakeQuoteTimeMutation,
  useRejectCakeQuoteTimeMutation,
  useUploadFlavorsMutation,
} = cakePricingApi;
