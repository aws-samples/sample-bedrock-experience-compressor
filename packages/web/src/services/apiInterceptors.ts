import { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

import { getIdToken, refreshSession } from './auth';

let isRefreshing = false;
let pendingRequests: Array<(token: string) => void> = [];

const processQueue = (token: string) => {
  pendingRequests.forEach((cb) => cb(token));
  pendingRequests = [];
};

export const setupInterceptors = (instance: AxiosInstance) => {
  instance.interceptors.request.use((config) => {
    const token = getIdToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        if (isRefreshing) {
          // Another refresh in progress — queue this request
          return new Promise((resolve) => {
            pendingRequests.push((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(instance(originalRequest));
            });
          });
        }

        isRefreshing = true;
        const token = await refreshSession();
        isRefreshing = false;

        if (token) {
          processQueue(token);
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return instance(originalRequest);
        }

        // Refresh failed — redirect to login
        pendingRequests = [];
        window.location.href = '/login';
      }

      return Promise.reject(error);
    }
  );
};
