import { apiSlice } from './apiSlice';

export type AIPersonality = 'friendly' | 'professional' | 'casual' | 'formal';

export interface AISettings {
    ai_personality: AIPersonality;
    ai_greeting_template_id: string | null;
    ai_farewell_template_id: string | null;
    ai_instructions_enabled: boolean;
    ai_custom_instructions?: string;
}

export interface AIPromptTemplate {
    id: string;
    name: string;
    template_type: 'greeting' | 'farewell' | 'custom' | 'product_suggestion';
    content: string;
    variables: string[];
    is_active: boolean;
}

export const aiPromptsApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getAiSettings: builder.query<AISettings, void>({
            query: () => '/ai-prompts/settings',
            providesTags: ['AISettings'],
        }),
        updateAiSettings: builder.mutation<void, Partial<AISettings>>({
            query: (body) => ({
                url: '/ai-prompts/settings',
                method: 'PUT',
                body,
            }),
            invalidatesTags: ['AISettings'],
        }),
        listTemplates: builder.query<AIPromptTemplate[], void>({
            query: () => '/ai-prompts/templates',
            providesTags: ['AIPTemplates'],
            transformResponse: (response: { templates: AIPromptTemplate[] }) => response.templates,
        }),
        createTemplate: builder.mutation<AIPromptTemplate, Partial<AIPromptTemplate>>({
            query: (body) => ({
                url: '/ai-prompts/templates',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['AIPTemplates'],
        }),
        updateTemplate: builder.mutation<void, { id: string; updates: Partial<AIPromptTemplate> }>({
            query: ({ id, updates }) => ({
                url: `/ai-prompts/templates/${id}`,
                method: 'PATCH',
                body: updates,
            }),
            invalidatesTags: ['AIPTemplates'],
        }),
        deleteTemplate: builder.mutation<void, string>({
            query: (id) => ({
                url: `/ai-prompts/templates/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['AIPTemplates'],
        }),
    }),
});

export const {
    useGetAiSettingsQuery,
    useUpdateAiSettingsMutation,
    useListTemplatesQuery,
    useCreateTemplateMutation,
    useUpdateTemplateMutation,
    useDeleteTemplateMutation,
} = aiPromptsApi;
