import { apiSlice } from './apiSlice';
import { Category, CategoriesResponse, CategoryFormData } from '@/types';

export const categoriesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCategories: builder.query<CategoriesResponse, void>({
      query: () => '/categories',
      providesTags: ['Categories'],
    }),
    createCategory: builder.mutation<{ category: Category }, CategoryFormData>({
      query: (data) => ({
        url: '/categories',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Categories'],
    }),
    updateCategory: builder.mutation<{ category: Category }, { id: string } & Partial<CategoryFormData> & { sort_order?: number }>({
      query: ({ id, ...data }) => ({
        url: `/categories/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Categories'],
    }),
    deleteCategory: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/categories/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Categories'],
    }),
    uploadCategoryImage: builder.mutation<{ image_url: string }, { id: string; formData: FormData }>({
      query: ({ id, formData }) => ({
        url: `/categories/${id}/image`,
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Categories'],
    }),
  }),
});

export const { 
  useGetCategoriesQuery, 
  useCreateCategoryMutation, 
  useUpdateCategoryMutation, 
  useDeleteCategoryMutation,
  useUploadCategoryImageMutation
} = categoriesApi;
