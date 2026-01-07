import { apiSlice } from './apiSlice';

export interface BusinessAmenity {
  id: string;
  business_id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string | null;
  images: string[];
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at?: string;
}

interface AmenitiesResponse {
  amenities: BusinessAmenity[];
}

interface AmenityResponse {
  amenity: BusinessAmenity;
}

interface CreateAmenityInput {
  name: string;
  slug?: string;
  description: string;
  image_url?: string;
  images?: string[];
  is_active?: boolean;
}

interface UpdateAmenityInput {
  id: string;
  name?: string;
  slug?: string;
  description?: string;
  image_url?: string;
  images?: string[];
  is_active?: boolean;
  display_order?: number;
}

export const amenitiesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAmenities: builder.query<AmenitiesResponse, void>({
      query: () => '/admin/amenities',
      providesTags: ['Amenities'],
    }),
    getAmenity: builder.query<AmenityResponse, string>({
      query: (id) => `/admin/amenities/${id}`,
      providesTags: ['Amenities'],
    }),
    createAmenity: builder.mutation<AmenityResponse, CreateAmenityInput>({
      query: (data) => ({
        url: '/admin/amenities',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Amenities'],
    }),
    updateAmenity: builder.mutation<AmenityResponse, UpdateAmenityInput>({
      query: ({ id, ...data }) => ({
        url: `/admin/amenities/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Amenities'],
    }),
    deleteAmenity: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/admin/amenities/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Amenities'],
    }),
    updateAmenityImage: builder.mutation<AmenityResponse, { id: string; image_url: string }>({
      query: ({ id, image_url }) => ({
        url: `/admin/amenities/${id}/image`,
        method: 'POST',
        body: { image_url },
      }),
      invalidatesTags: ['Amenities'],
    }),
    uploadAmenityImage: builder.mutation<{ image_url: string }, { id: string; formData: FormData }>({
      query: ({ id, formData }) => ({
        url: `/admin/amenities/${id}/upload`,
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Amenities'],
    }),
    toggleAmenity: builder.mutation<AmenityResponse, string>({
      query: (id) => ({
        url: `/admin/amenities/${id}/toggle`,
        method: 'POST',
      }),
      invalidatesTags: ['Amenities'],
    }),
  }),
});

export const {
  useGetAmenitiesQuery,
  useGetAmenityQuery,
  useCreateAmenityMutation,
  useUpdateAmenityMutation,
  useDeleteAmenityMutation,
  useUpdateAmenityImageMutation,
  useUploadAmenityImageMutation,
  useToggleAmenityMutation,
} = amenitiesApi;
