import { apiSlice } from './apiSlice';

export interface Campaign {
    id: string;
    name: string;
    description?: string;
    template_name: string;
    language_code: string;
    image_url?: string;
    body_parameters?: string[];
    select_all: boolean;
    user_ids?: string[];
    excluded_user_ids?: string[];
    status: 'pending' | 'sending' | 'completed' | 'failed' | 'scheduled' | 'processing' | 'cancelled' | 'draft';
    scheduled_at?: string;
    total_recipients: number;
    successful_sends: number;
    failed_sends: number;
    job_id?: string;
    template_variables?: {
        body_params?: string[];
        header_params?: string[];
        header_param?: string; // Deprecated but kept for compatibility
    };
    created_at: string;
}

export interface ComponentParameter {
    type: 'text' | 'image';
    text?: string;
    image?: { link: string };
}

export interface TemplateComponent {
    type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
    format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
    text?: string;
    example?: {
        header_handle?: string[];
        header_text?: string[];
        body_text?: string[][];
    };
}

export interface Template {
    id: string;
    name: string;
    status: 'APPROVED' | 'PENDING' | 'REJECTED';
    category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
    language: string;
    components: TemplateComponent[];
    parameterInfo: {
        headerParams: number;
        headerType: 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'TEXT' | 'NONE';
        bodyParams: number;
        buttonParams: { index: number; type: string }[];
    };
}

export interface TemplatesResponse {
    success: boolean;
    templates: Template[];
    count: number;
}

export interface SendCampaignRequest {
    template_name: string;
    language_code: string;
    components: any[];
    phone_numbers?: string[];
    user_ids?: string[];
    filter_tags?: string[];
    scheduled_at?: string; // ISO string
}

export interface SendCampaignResponse {
    success: boolean;
    message: string;
    job_id: string;
    campaign?: Campaign;
}

export interface CampaignHistoryResponse {
    success: boolean;
    campaigns: Campaign[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface UploadImageResponse {
    success: boolean;
    imageUrl: string;
    filePath: string;
}

export interface CreateCampaignRequest {
    name: string;
    description?: string;
    template_name: string;
    language_code: string;
    image_url?: string;
    template_variables?: {
        body_params?: string[];
        header_param?: string; // Assuming based on typical usage, though contract didn't explicitly detail header
    };
    target_type: 'all' | 'custom';
    target_phone_numbers?: string[];
    target_user_ids?: string[];
    scheduled_at?: string; // ISO string
}

export const campaignsApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getTemplates: builder.query<TemplatesResponse, { status?: string }>({
            query: ({ status = 'APPROVED' }) => `/admin/campaigns/templates?status=${status}`,
        }),
        getCampaigns: builder.query<CampaignHistoryResponse, { page?: number; limit?: number; status?: string; search?: string }>({
            query: ({ page = 1, limit = 10, status, search }) => {
                const params = new URLSearchParams();
                params.append('page', String(page));
                params.append('limit', String(limit));
                if (status) params.append('status', status);
                if (search) params.append('search', search);
                return `/admin/campaigns?${params.toString()}`;
            },
            providesTags: ['Campaigns' as any],
        }),
        getCampaign: builder.query<{ success: boolean; data: Campaign }, string>({
            query: (id) => `/admin/campaigns/${id}`,
            providesTags: (_result, _error, id) => [{ type: 'Campaigns' as any, id }],
        }),
        createCampaign: builder.mutation<SendCampaignResponse, CreateCampaignRequest>({
            query: (body) => ({
                url: '/admin/campaigns/create',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Campaigns' as any],
        }),
        sendCampaign: builder.mutation<SendCampaignResponse, SendCampaignRequest>({
            query: (body) => ({
                url: '/admin/campaigns/send',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Campaigns' as any],
        }),
        uploadCampaignImage: builder.mutation<UploadImageResponse, File>({
            query: (file) => {
                const formData = new FormData();
                formData.append('image', file);
                return {
                    url: '/admin/campaigns/upload-image',
                    method: 'POST',
                    body: formData,
                };
            },
        }),
        updateCampaign: builder.mutation<SendCampaignResponse, { id: string; data: CreateCampaignRequest }>({
            query: ({ id, data }) => ({
                url: `/admin/campaigns/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['Campaigns' as any],
        }),
        sendDraftCampaign: builder.mutation<SendCampaignResponse, string>({
            query: (id) => ({
                url: `/admin/campaigns/${id}/send`,
                method: 'POST',
            }),
            invalidatesTags: ['Campaigns' as any],
        }),
        cancelCampaign: builder.mutation<{ success: boolean; message: string }, string>({
            query: (id) => ({
                url: `/admin/campaigns/${id}/cancel`,
                method: 'POST',
            }),
            invalidatesTags: ['Campaigns' as any],
        }),
        deleteCampaign: builder.mutation<{ success: boolean }, string>({
            query: (id) => ({
                url: `/admin/campaigns/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Campaigns' as any],
        }),
    }),
});

export const {
    useGetTemplatesQuery,
    useGetCampaignsQuery,
    useGetCampaignQuery,
    useCreateCampaignMutation,
    useSendCampaignMutation,
    useUploadCampaignImageMutation,
    useUpdateCampaignMutation,
    useSendDraftCampaignMutation,
    useCancelCampaignMutation,
    useDeleteCampaignMutation,
} = campaignsApi;
