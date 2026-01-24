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
    }),
});

export const { useGetCustomersQuery, useLazyGetCustomersQuery } = customersApi;
