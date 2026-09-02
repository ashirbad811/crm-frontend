import { apiSlice } from './apiSlice';

export const activitiesApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getActivities: builder.query({
      query: (params) => ({
        url: '/activities',
        params,
      }),
      providesTags: ['Activity'],
    }),
    updateActivity: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/activities/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Activity', id }, 'Activity', 'Dashboard'],
    }),
  }),
});

export const {
  useGetActivitiesQuery,
  useUpdateActivityMutation,
} = activitiesApiSlice;
