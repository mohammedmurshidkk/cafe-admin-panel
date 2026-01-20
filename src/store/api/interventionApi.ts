import { apiSlice } from './apiSlice';

export type InterventionType = 'custom_cake' | 'urgent_delivery' | 'out_of_radius' | 'party_hall' | 'custom_cake_time_confirmation' | 'other';
export type InterventionStatus = 'pending' | 'in_review' | 'resolved' | 'cancelled' | 'expired';

export interface Intervention {
    customer_flavor: any;
    customer_weight: any;
    message: any;
    image_url: any;
    id: string;
    business_id: string;
    session_id: string;
    customer_id: string;
    type: InterventionType;
    status: InterventionStatus;

    request_data: {
        image_url?: string;
        customer_weight?: string;
        customer_flavor?: string;
        message?: string;
        [key: string]: any;
    };

    ai_analysis?: any;

    admin_response?: {
        approved: boolean;
        price?: number;
        message?: string;
        notes?: string;
    } | null;

    resolved_by?: string | null;
    resolved_at?: string | null;
    created_at: string;
    updated_at: string;
    expires_at?: string | null;

    // Optional expanded fields
    customer?: {
        id: string;
        name: string;
        phone: string;
    };
}

export interface ResolveInterventionRequest {
    approved: boolean;
    price?: number;
    message?: string;
    notes?: string;
    custom_delivery_fee?: number;
}

interface ApiResponse<T> {
    success: boolean;
    data: T;
}

interface ListInterventionsParams {
    status?: InterventionStatus;
    limit?: number;
    page?: number;
}

export const interventionApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getInterventions: builder.query<Intervention[], ListInterventionsParams>({
            query: (params) => ({
                url: '/admin/interventions/',
                params,
            }),
            providesTags: ['Interventions'],
        }),

        getInterventionsBySession: builder.query<Intervention[], string>({
            query: (sessionId) => `/admin/interventions/session/${sessionId}`,
            providesTags: (_result, _error, sessionId) => [{ type: 'Interventions', id: sessionId }],
        }),

        getIntervention: builder.query<ApiResponse<Intervention>, string>({
            query: (id) => `/admin/interventions/${id}`,
            providesTags: (_result, _error, id) => [{ type: 'Interventions', id }],
        }),

        claimIntervention: builder.mutation<ApiResponse<Intervention>, string>({
            query: (id) => ({
                url: `/admin/interventions/${id}/claim`,
                method: 'PUT',
            }),
            invalidatesTags: ['Interventions'],
        }),

        resolveIntervention: builder.mutation<ApiResponse<Intervention>, { id: string } & ResolveInterventionRequest>({
            query: ({ id, ...body }) => ({
                url: `/admin/interventions/${id}/resolve`,
                method: 'PUT',
                body,
            }),
            invalidatesTags: (result) => [
                'Interventions',
                // Invalidate the chat messages for this session so the new resolution message appears
                { type: 'Messages', id: result?.data?.session_id }
            ],
        }),

        cancelIntervention: builder.mutation<ApiResponse<{ success: boolean }>, string>({
            query: (id) => ({
                url: `/admin/interventions/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Interventions'],
        }),
    }),
});

export const {
    useGetInterventionsQuery,
    useGetInterventionsBySessionQuery,
    useGetInterventionQuery,
    useClaimInterventionMutation,
    useResolveInterventionMutation,
    useCancelInterventionMutation,
} = interventionApi;
