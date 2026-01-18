import { apiSlice } from './apiSlice';

// Types
export interface UsageSummary {
    businessId: string;
    businessName: string;
    period: { from: string; to: string };
    ai: {
        totalRequests: number;
        tokensInput: number;
        tokensOutput: number;
        errorCount: number;
        avgLatencyMs: number;
        estimatedCostUsd: number;
    };
    whatsapp: {
        messagesReceived: number;
        messagesSent: number;
        mediaSent: number;
        estimatedCostUsd: number;
    };
    googleMaps: {
        apiCalls: number;
        estimatedCostUsd: number;
    };
    business: {
        ordersCount: number;
        revenue: number;
        uniqueCustomers: number;
    };
    totalCostUsd: number;
}

export interface Alert {
    type: 'spike' | 'high_error_rate' | 'approaching_limit' | 'inactive';
    severity: 'warning' | 'critical';
    message: string;
    businessId: string;
    businessName?: string;
}

export interface DashboardResponse {
    period: { from: string; to: string };
    totals: {
        totalCostUsd: number;
        totalAICalls: number;
        totalWhatsAppMessages: number;
        totalMapsCalls: number;
        totalOrders: number;
        totalRevenue: number;
    };
    realTime: {
        aiCalls: number;
        whatsappMessages: number;
        mapsAPICalls: number;
        estimatedCostUsd: number;
    };
    alerts: Alert[];
    totalBusinesses: number;
    businesses: UsageSummary[];
}

export interface UsageOverviewResponse {
    period: { from: string; to: string };
    businesses: UsageSummary[];
}

export interface TrendData {
    date: string;
    aiCalls: number;
    aiCost: number;
    whatsappMessages: number;
    whatsappCost: number;
    mapsCalls: number;
    mapsCost: number;
    totalCost: number;
}

export interface BusinessUsageResponse {
    summary: UsageSummary;
    trends: TrendData[];
    alerts: Alert[];
}

export interface TrendsResponse {
    period: { from: string; to: string };
    trends: TrendData[];
}

export interface AlertsResponse {
    alerts: Alert[];
}

export interface RealTimeResponse {
    aiCalls: number;
    whatsappMessages: number;
    mapsAPICalls: number;
    estimatedCostUsd: number;
    timestamp: string;
}

export interface CostConfig {
    api_type: string;
    provider: string;
    cost_per_input_token: number;
    cost_per_output_token: number;
    cost_per_request: number;
    cost_per_message: number;
    description: string;
}

export interface CostsResponse {
    period: { from: string; to: string };
    totalCost: number;
    breakdown: {
        ai: {
            totalCost: number;
            totalCalls: number;
            tokensInput: number;
            tokensOutput: number;
        };
        whatsapp: {
            totalCost: number;
            totalMessages: number;
            mediaCount: number;
        };
        googleMaps: {
            totalCost: number;
            totalCalls: number;
        };
    };
    pricing: CostConfig[];
}

export interface UpdateCostConfigRequest {
    apiType: 'ai' | 'whatsapp' | 'google_maps';
    provider: string;
    costPerInputToken?: number;
    costPerOutputToken?: number;
    costPerRequest?: number;
    costPerMessage?: number;
}

export interface ApiUsageLog {
    id: string;
    business_id: string;
    api_type: 'ai' | 'whatsapp' | 'google_maps';
    provider: string;
    tokens_input: number;
    tokens_output: number;
    latency_ms: number;
    success: boolean;
    error_message: string | null;
    message_direction: 'inbound' | 'outbound' | null;
    message_type: string | null;
    distance_meters: number | null;
    estimated_cost_usd: number;
    created_at: string;
}

export interface RawLogsResponse {
    logs: ApiUsageLog[];
}

export const usageApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getDashboard: builder.query<DashboardResponse, { from?: string; to?: string } | void>({
            query: (params) => ({
                url: '/superadmin/usage/dashboard',
                params: params || {},
            }),
            providesTags: ['UsageDashboard'],
        }),
        getUsageOverview: builder.query<UsageOverviewResponse, { from?: string; to?: string }>({
            query: (params) => ({
                url: '/superadmin/usage/overview',
                params,
            }),
            providesTags: ['UsageOverview'],
        }),
        getBusinessUsage: builder.query<BusinessUsageResponse, { businessId: string; from?: string; to?: string }>({
            query: ({ businessId, ...params }) => ({
                url: `/superadmin/usage/business/${businessId}`,
                params,
            }),
            providesTags: (_result, _error, { businessId }) => [{ type: 'BusinessUsage', id: businessId }],
        }),
        getTrends: builder.query<TrendsResponse, { businessId?: string; from?: string; to?: string }>({
            query: (params) => ({
                url: '/superadmin/usage/trends',
                params,
            }),
        }),
        getAlerts: builder.query<AlertsResponse, { businessId?: string } | void>({
            query: (params) => ({
                url: '/superadmin/usage/alerts',
                params: params || {},
            }),
        }),
        getRealTime: builder.query<RealTimeResponse, { businessId?: string } | void>({
            query: (params) => ({
                url: '/superadmin/usage/realtime',
                params: params || {},
            }),
            // Real-time data doesn't need caching/tags usually, 
            // or we can set a very short keepUnusedDataFor
            keepUnusedDataFor: 0,
        }),
        aggregateUsage: builder.mutation<{ success: boolean; message: string }, { date?: string }>({
            query: (body) => ({
                url: '/superadmin/usage/aggregate',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['UsageDashboard', 'UsageOverview', 'BusinessUsage', 'UsageCosts'],
        }),
        getCosts: builder.query<CostsResponse, { from?: string; to?: string }>({
            query: (params) => ({
                url: '/superadmin/usage/costs',
                params,
            }),
            providesTags: ['UsageCosts'],
        }),
        updateCostConfig: builder.mutation<void, UpdateCostConfigRequest>({
            query: (body) => ({
                url: '/superadmin/usage/costs/config',
                method: 'PUT',
                body,
            }),
            invalidatesTags: ['UsageCosts', 'UsageDashboard', 'UsageOverview', 'BusinessUsage'],
        }),
        getRawLogs: builder.query<RawLogsResponse, { businessId?: string; apiType?: string; from?: string; to?: string; limit?: number }>({
            query: (params) => ({
                url: '/superadmin/usage/raw-logs',
                params,
            }),
        }),
    }),
});

export const {
    useGetDashboardQuery,
    useGetUsageOverviewQuery,
    useGetBusinessUsageQuery,
    useGetTrendsQuery,
    useGetAlertsQuery,
    useGetRealTimeQuery,
    useGetCostsQuery,
    useUpdateCostConfigMutation,
    useGetRawLogsQuery,
    useAggregateUsageMutation,
} = usageApi;
