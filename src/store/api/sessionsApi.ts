import { apiSlice } from './apiSlice';
import { Session, SessionsResponse, SessionDetail, SuccessResponse, SessionStatus } from '@/types';

interface SessionsQueryParams {
  status?: SessionStatus | 'all' | '';
  page?: number;
  limit?: number;
}

export const sessionsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getSessions: builder.query<SessionsResponse, SessionsQueryParams>({
      query: ({ status, page = 1, limit = 20 }) => {
        const params = new URLSearchParams();
        if (status && status !== 'all') params.append('status', status);
        params.append('page', String(page));
        params.append('limit', String(limit));
        return `/sessions?${params.toString()}`;
      },
      providesTags: ['Sessions'],
    }),
    getRecentSessions: builder.query<{ sessions: Session[] }, { status?: string; limit: number }>({
      query: ({ status, limit }) => {
        const params = new URLSearchParams();
        if (status) params.append('status', status);
        params.append('limit', String(limit));
        return `/sessions?${params.toString()}`;
      },
      providesTags: ['Sessions'],
    }),
    getSessionDetail: builder.query<SessionDetail, string>({
      query: (sessionId) => `/sessions/${sessionId}`,
      providesTags: ['Sessions'],
    }),
    toggleAiPause: builder.mutation<SuccessResponse, { sessionId: string; paused: boolean }>({
      query: ({ sessionId, paused }) => ({
        url: `/sessions/${sessionId}/ai-pause`,
        method: 'PATCH',
        body: { paused },
      }),
      invalidatesTags: ['Sessions'],
    }),
  }),
});

export const { 
  useGetSessionsQuery, 
  useGetRecentSessionsQuery, 
  useGetSessionDetailQuery, 
  useToggleAiPauseMutation 
} = sessionsApi;
