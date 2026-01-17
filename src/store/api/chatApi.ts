import { apiSlice } from './apiSlice';
import {
  SessionListResponse,
  SessionMessagesResponse,
  SendMessageRequest,
  SendMessageResponse,
  UploadMediaResponse,
  AiPauseResponse,
  ChatMessage,
  ChatSessionStatus,
} from '@/types';

export const chatApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getChatSessions: builder.query<
      SessionListResponse,
      { page?: number; limit?: number; status?: ChatSessionStatus | 'all' }
    >({
      query: ({ page = 1, limit = 20, status }) => {
        const params = new URLSearchParams();
        params.append('page', String(page));
        params.append('limit', String(limit));
        if (status && status !== 'all') params.append('status', status);
        return `admin/chat/sessions?${params.toString()}`;
      },
      providesTags: ['ChatSessions'],
    }),

    getSessionMessages: builder.query<
      SessionMessagesResponse,
      { sessionId: string; page?: number; limit?: number }
    >({
      query: ({ sessionId, page = 1, limit = 20 }) =>
        `admin/chat/sessions/${sessionId}?page=${page}&limit=${limit}`,
      providesTags: (_result, _error, { sessionId }) => [
        { type: 'Messages', id: sessionId },
      ],
    }),

    sendMessage: builder.mutation<
      SendMessageResponse,
      { sessionId: string; message: SendMessageRequest }
    >({
      query: ({ sessionId, message }) => ({
        url: `/admin/chat/sessions/${sessionId}/reply`,
        method: 'POST',
        body: message,
      }),
      async onQueryStarted({ sessionId, message }, { dispatch, queryFulfilled }) {
        try {
          const { data: response } = await queryFulfilled;
          const newMessage = response?.message || response?.data?.message;

          if (newMessage) {
            // Add the new message to the cache
            dispatch(
              chatApi.util.updateQueryData(
                'getSessionMessages',
                { sessionId },
                (draft) => {
                  // Handle nested response structure
                  const messages = draft?.data?.messages;
                  if (messages) {
                    const exists = messages.some((m: ChatMessage) => m.id === newMessage.id);
                    if (!exists) {
                      // API returns newest first, so unshift to add at beginning
                      messages.unshift(newMessage);
                    }
                  }
                }
              )
            );
          }

          // Invalidate sessions to update last_message
          dispatch(chatApi.util.invalidateTags(['ChatSessions']));
          // If quote was sent, invalidate CakeQuotes to refresh pending quote
          if (message.quote_id) {
            dispatch(chatApi.util.invalidateTags([{ type: 'CakeQuotes' as const, id: sessionId }]));
          }
        } catch {
          // Error handling
        }
      },
    }),

    uploadMedia: builder.mutation<
      UploadMediaResponse,
      { file: File; type: 'image' | 'video' | 'audio' | 'document' }
    >({
      query: ({ file, type }) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);
        return {
          url: '/admin/chat/upload/media',
          method: 'POST',
          body: formData,
        };
      },
    }),

    toggleChatAiPause: builder.mutation<
      AiPauseResponse,
      { sessionId: string; paused: boolean }
    >({
      query: ({ sessionId, paused }) => ({
        url: `/admin/chat/sessions/${sessionId}/ai-pause`,
        method: 'PATCH',
        body: { paused },
      }),
      async onQueryStarted({ sessionId, paused }, { dispatch, queryFulfilled }) {
        // Optimistically update ChatView's session data
        const patchResult = dispatch(
          chatApi.util.updateQueryData(
            'getSessionMessages',
            { sessionId },
            (draft) => {
              const session = draft?.data?.session;
              if (session) {
                session.ai_paused = paused;
              }
            }
          )
        );
        try {
          await queryFulfilled;
          // Invalidate both tags to sync everything
          dispatch(chatApi.util.invalidateTags(['ChatSessions', { type: 'Messages', id: sessionId }]));
        } catch {
          // Revert on error
          patchResult.undo();
        }
      },
    }),

    markSessionAsRead: builder.mutation<{ success: boolean }, string>({
      query: (sessionId) => ({
        url: `admin/chat/sessions/${sessionId}/mark-read`,
        method: 'POST',
      }),
      invalidatesTags: ['ChatSessions'],
    }),
  }),
});

export const {
  useGetChatSessionsQuery,
  useLazyGetChatSessionsQuery,
  useGetSessionMessagesQuery,
  useLazyGetSessionMessagesQuery,
  useSendMessageMutation,
  useUploadMediaMutation,
  useToggleChatAiPauseMutation,
  useMarkSessionAsReadMutation,
} = chatApi;

// Helper to add a new message to cache (for WebSocket updates)
export const addMessageToCache = (
  dispatch: any,
  sessionId: string,
  message: ChatMessage
) => {
  dispatch(
    chatApi.util.updateQueryData(
      'getSessionMessages',
      { sessionId },
      (draft) => {
        const messages = draft.messages || draft.data?.messages;
        if (messages) {
          const exists = messages.some((m: ChatMessage) => m.id === message.id);
          if (!exists) {
            messages.push(message);
          }
        }
      }
    )
  );
};
