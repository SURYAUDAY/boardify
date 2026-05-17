import axios from 'axios';

// When VITE_SERVER_URL is empty, requests go to the same origin as the page
// (Vite dev server proxies /api → backend; in production both are served together).
const SERVER_URL = import.meta.env.VITE_SERVER_URL || '';

const api = axios.create({
  baseURL: `${SERVER_URL}/api`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('wb_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('wb_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
