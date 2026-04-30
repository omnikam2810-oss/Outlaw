import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
});

let refreshRequest = null;

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ds_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthRequest = originalRequest?.url?.includes('/auth/login') || originalRequest?.url?.includes('/auth/register') || originalRequest?.url?.includes('/auth/refresh');

    if (error.response?.status === 401 && !originalRequest?._retry && !isAuthRequest) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('ds_refresh_token');

      if (refreshToken) {
        try {
          refreshRequest = refreshRequest || axios.post(`${api.defaults.baseURL}/auth/refresh`, { refreshToken }, { withCredentials: true });
          const { data } = await refreshRequest;
          refreshRequest = null;
          localStorage.setItem('ds_token', data.token);
          localStorage.setItem('ds_refresh_token', data.refreshToken);
          originalRequest.headers.Authorization = `Bearer ${data.token}`;
          return api(originalRequest);
        } catch {
          refreshRequest = null;
        }
      }

      localStorage.removeItem('ds_token');
      localStorage.removeItem('ds_refresh_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
