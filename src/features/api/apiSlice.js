import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:5000/api', 
    prepareHeaders: (headers) => {
      const userInfo = JSON.parse(sessionStorage.getItem('userInfo'));
      if (userInfo && userInfo.token) {
        headers.set('authorization', `Bearer ${userInfo.token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Lead', 'Customer', 'Deal', 'Activity', 'Dashboard', 'Notification', 'User'],
  endpoints: (builder) => ({}),
});
