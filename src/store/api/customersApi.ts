import { apiSlice } from './apiSlice';

export interface Customer {
    id: string;
    name: string;
    phone: string;
    email?: string;
}

export interface CustomersResponse {
    customers: Customer[];
    pagination: {
        page: number;
        limit: number;
        total: number;
    };
}

export type CustomerSegment = 'new' | 'returning' | 'vip' | 'at_risk' | 'churned';

export interface CustomerProfile {
    customer_id: string;
    business_id: string;
    segment: CustomerSegment;
    total_spent: number;
    total_orders: number;
    avg_order_value: number;
    first_order_at: string | null;
    last_order_at: string;
    tags: string[];
    notes?: string;
    preferences: {
        favorite_items?: Record<string, number>;
        preferred_fulfillment?: 'delivery' | 'takeaway';
    };
    customer: {
        phone: string;
        name: string;
    };
}

export interface CustomerProfilesResponse {
    profiles: CustomerProfile[];
    total: number;
}

export interface SegmentCounts {
    all: number;
    new: number;
    returning: number;
    vip: number;
    at_risk: number;
    churned: number;
}

export const customersApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getCustomers: builder.query<CustomersResponse, { search?: string; page?: number; limit?: number }>({
            query: ({ search, page = 1, limit = 20 }) => {
                const params = new URLSearchParams();
                if (search) params.append('search', search);
                params.append('page', String(page));
                params.append('limit', String(limit));
                return `/admin/customers?${params.toString()}`;
            },
        }),
        getCustomerProfiles: builder.query<CustomerProfilesResponse, { segment?: CustomerSegment | 'all'; search?: string; page?: number; limit?: number }>({
            query: ({ segment, search, page = 1, limit = 20 }) => {
                const params = new URLSearchParams();
                if (segment && segment !== 'all') params.append('segment', segment);
                if (search) params.append('search', search);
                params.append('offset', String((page - 1) * limit));
                params.append('limit', String(limit));
                return `/customer-profiles?${params.toString()}`;
            },
            transformResponse: (response: { profiles: CustomerProfile[]; total: number }) => response,
            providesTags: ['Customers'],
        }),
        getCustomerProfile: builder.query<CustomerProfile, string>({
            query: (customerId) => `/customer-profiles/${customerId}`,
            transformResponse: (response: { profile: CustomerProfile }) => response.profile,
            providesTags: (result, error, id) => [{ type: 'Customers', id }],
        }),
        getSegmentCounts: builder.query<SegmentCounts, void>({
            query: () => '/customer-profiles/segments',
            transformResponse: (response: { segments: SegmentCounts }) => response.segments,
            providesTags: ['Customers'],
        }),
        updateCustomerTags: builder.mutation<void, { customerId: string; tags: string[] }>({
            query: ({ customerId, tags }) => ({
                url: `/customer-profiles/${customerId}/tags`,
                method: 'PUT',
                body: { tags },
            }),
            invalidatesTags: (result, error, { customerId }) => [{ type: 'Customers', id: customerId }, 'Customers'],
        }),
        updateCustomerNotes: builder.mutation<void, { customerId: string; notes: string }>({
            query: ({ customerId, notes }) => ({
                url: `/customer-profiles/${customerId}/notes`,
                method: 'PUT',
                body: { notes },
            }),
            invalidatesTags: (result, error, { customerId }) => [{ type: 'Customers', id: customerId }, 'Customers'],
        }),
    }),
});

export const {
    useGetCustomersQuery,
    useLazyGetCustomersQuery,
    useGetCustomerProfilesQuery,
    useGetCustomerProfileQuery,
    useGetSegmentCountsQuery,
    useUpdateCustomerTagsMutation,
    useUpdateCustomerNotesMutation,
} = customersApi;
