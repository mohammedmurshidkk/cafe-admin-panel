import { apiSlice } from './apiSlice';

export interface AnalyticsSummary {
    total_orders: number;
    total_revenue: number;
    avg_order_value: number;
    completed_order_rate: number;
    new_customers: number;
    session_completion_rate: number;
}

export interface AnalyticsTrend {
    period: string;
    order_count: number;
    total_revenue: number;
}

export interface TopCustomer {
    customer_id: string;
    phone: string;
    name: string | null;
    total_spent: number;
    order_count: number;
}

export interface RealtimeMetrics {
    today_stats: {
        order_count?: number;
        total_revenue?: number;
        completed_count?: number;
    };
    active_sessions: number;
}

export const analyticsApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getAnalyticsSummary: builder.query<AnalyticsSummary, { from?: string; to?: string }>({
            query: (params) => ({
                url: '/analytics/summary',
                params,
            }),
            transformResponse: (response: { summary: AnalyticsSummary }) => response.summary,
            providesTags: ['Analytics'],
        }),
        getAnalyticsTrends: builder.query<AnalyticsTrend[], { from?: string; to?: string; granularity?: 'daily' | 'weekly' | 'monthly' }>({
            query: (params) => ({
                url: '/analytics/trends',
                params,
            }),
            transformResponse: (response: { trends: AnalyticsTrend[] }) => response.trends,
            providesTags: ['Analytics'],
        }),
        getTopCustomers: builder.query<TopCustomer[], { limit?: number }>({
            query: (params) => ({
                url: '/analytics/top-customers',
                params,
            }),
            transformResponse: (response: { topCustomers: TopCustomer[] }) => response.topCustomers,
            providesTags: ['Analytics'],
        }),
        getRealtimeMetrics: builder.query<RealtimeMetrics, void>({
            query: () => '/analytics/realtime',
            providesTags: ['Analytics'],
        }),
        refreshAnalytics: builder.mutation<void, void>({
            query: () => ({
                url: '/analytics/refresh',
                method: 'POST',
            }),
            invalidatesTags: ['Analytics'],
        }),
    }),
});

export const {
    useGetAnalyticsSummaryQuery,
    useGetAnalyticsTrendsQuery,
    useGetTopCustomersQuery,
    useGetRealtimeMetricsQuery,
    useRefreshAnalyticsMutation,
} = analyticsApi;
