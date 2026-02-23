import { apiSlice } from './apiSlice';
import {
  SuperadminBusiness,
  BusinessesResponse,
  SuperadminBusinessFormData,
  CreateAdminData,
  SuccessResponse,
  AnalyticsOverviewResponse,
  BusinessStats,
  WebhookStatus,
  FeatureDefinitionsResponse,
  BusinessFeaturesResponse,
  FeatureUpdate,
  DataTypesResponse,
  DataSummaryResponse,
  DependencyCheck,
  DataClearResult,
} from '@/types';

export interface AuditLog {
  id: string;
  admin_id: string;
  admin_email: string;
  admin_role: string;
  action: string;
  entity_type: string;
  entity_id: string;
  business_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface AuditLogsResponse {
  logs: AuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AuditStats {
  totalActions: number;
  actionsByType: Record<string, number>;
  topAdmins: { email: string; count: number }[];
}

export interface AuditLogsQueryParams {
  page?: number;
  limit?: number;
  businessId?: string;
  adminId?: string;
  action?: string;
  entityType?: string;
  from?: string;
  to?: string;
}

export const superadminApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getBusinesses: builder.query<BusinessesResponse, { search?: string; page?: number; limit?: number }>({
      query: ({ search = '', page = 1, limit = 20 }) =>
        `/superadmin/businesses?search=${search}&page=${page}&limit=${limit}`,
      providesTags: ['Businesses'],
    }),
    createBusiness: builder.mutation<{ business: SuperadminBusiness }, SuperadminBusinessFormData>({
      query: (data) => ({
        url: '/superadmin/businesses',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Businesses'],
    }),
    updateBusiness: builder.mutation<{ business: SuperadminBusiness }, { id: string } & Partial<SuperadminBusinessFormData>>({
      query: ({ id, ...data }) => ({
        url: `/superadmin/businesses/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Businesses'],
    }),
    toggleBusinessStatus: builder.mutation<SuccessResponse, { id: string; is_active: boolean }>({
      query: ({ id, is_active }) => ({
        url: `/superadmin/businesses/${id}/toggle-status`,
        method: 'PATCH',
        body: { is_active },
      }),
      invalidatesTags: ['Businesses'],
    }),
    uploadBusinessLogo: builder.mutation<{ logo_url: string }, { id: string; formData: FormData }>({
      query: ({ id, formData }) => ({
        url: `/superadmin/businesses/${id}/logo`,
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Businesses'],
    }),
    createBusinessAdmin: builder.mutation<SuccessResponse, CreateAdminData>({
      query: (data) => ({
        url: `/superadmin/businesses/${data?.business_id}/admins`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Businesses'],
    }),
    getAnalyticsOverview: builder.query<AnalyticsOverviewResponse, void>({
      query: () => '/superadmin/analytics/overview',
      providesTags: ['Businesses'],
    }),
    getBusinessStats: builder.query<BusinessStats, string>({
      query: (id) => `/superadmin/businesses/${id}/stats`,
    }),
    getWebhookStatus: builder.query<WebhookStatus, string>({
      query: (id) => `/superadmin/businesses/${id}/webhook-status`,
    }),
    getAuditLogs: builder.query<AuditLogsResponse, AuditLogsQueryParams>({
      query: (params) => {
        const urlParams = new URLSearchParams();
        if (params.page) urlParams.append('page', String(params.page));
        if (params.limit) urlParams.append('limit', String(params.limit));
        if (params.businessId) urlParams.append('businessId', params.businessId);
        if (params.adminId) urlParams.append('adminId', params.adminId);
        if (params.action) urlParams.append('action', params.action);
        if (params.entityType) urlParams.append('entityType', params.entityType);
        if (params.from) urlParams.append('from', params.from);
        if (params.to) urlParams.append('to', params.to);
        return `/superadmin/audit-logs?${urlParams.toString()}`;
      },
      providesTags: ['AuditLogs'],
    }),
    getAuditStats: builder.query<AuditStats, { days?: number; businessId?: string }>({
      query: ({ days = 30, businessId }) => {
        const params = new URLSearchParams();
        params.append('days', String(days));
        if (businessId) params.append('businessId', businessId);
        return `/superadmin/audit-logs/stats?${params.toString()}`;
      },
      providesTags: ['AuditLogs'],
    }),

    // Feature Management
    getFeatureDefinitions: builder.query<FeatureDefinitionsResponse, void>({
      query: () => '/superadmin/feature-definitions',
      providesTags: ['FeatureDefinitions'],
    }),
    getBusinessFeatures: builder.query<BusinessFeaturesResponse, string>({
      query: (businessId) => `/superadmin/businesses/${businessId}/features`,
      providesTags: (_result, _error, businessId) => [{ type: 'BusinessFeatures', id: businessId }],
    }),
    updateBusinessFeatures: builder.mutation<SuccessResponse, { businessId: string; features: FeatureUpdate[] }>({
      query: ({ businessId, features }) => ({
        url: `/superadmin/businesses/${businessId}/features`,
        method: 'PUT',
        body: { features },
      }),
      invalidatesTags: (_result, _error, { businessId }) => [{ type: 'BusinessFeatures', id: businessId }],
    }),

    // Data Clear
    getDataTypes: builder.query<DataTypesResponse, void>({
      query: () => '/superadmin/data-types',
    }),
    getDataSummary: builder.query<DataSummaryResponse, string>({
      query: (businessId) => `/superadmin/businesses/${businessId}/data-summary`,
      providesTags: (_result, _error, businessId) => [{ type: 'DataSummary', id: businessId }],
    }),
    checkClearDependencies: builder.mutation<DependencyCheck, { businessId: string; dataType: string }>({
      query: ({ businessId, dataType }) => ({
        url: `/superadmin/businesses/${businessId}/data-clear/check`,
        method: 'POST',
        body: { dataType },
      }),
    }),
    clearBusinessData: builder.mutation<DataClearResult, { businessId: string; dataType: string; confirm: boolean }>({
      query: ({ businessId, dataType, confirm }) => ({
        url: `/superadmin/businesses/${businessId}/data-clear`,
        method: 'POST',
        body: { dataType, confirm },
      }),
      invalidatesTags: (_result, _error, { businessId }) => [{ type: 'DataSummary', id: businessId }],
    }),
  }),
});

export const {
  useGetBusinessesQuery,
  useCreateBusinessMutation,
  useUpdateBusinessMutation,
  useToggleBusinessStatusMutation,
  useUploadBusinessLogoMutation,
  useCreateBusinessAdminMutation,
  useGetAnalyticsOverviewQuery,
  useGetBusinessStatsQuery,
  useGetWebhookStatusQuery,
  useGetAuditLogsQuery,
  useGetAuditStatsQuery,
  // Feature Management
  useGetFeatureDefinitionsQuery,
  useGetBusinessFeaturesQuery,
  useUpdateBusinessFeaturesMutation,
  // Data Clear
  useGetDataTypesQuery,
  useGetDataSummaryQuery,
  useCheckClearDependenciesMutation,
  useClearBusinessDataMutation,
} = superadminApi;
