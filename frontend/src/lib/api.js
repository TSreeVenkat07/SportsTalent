import axios from 'axios';

const viteApiUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:5000";
const BASE_URL = viteApiUrl.endsWith("/api") ? viteApiUrl : `${viteApiUrl}/api`;

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 🪄 Senior Tip: Intercept all requests to inject the JWT token
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('sth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const getAuthHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
});

export default api;
