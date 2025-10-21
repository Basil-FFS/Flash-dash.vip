import axios from 'axios';

// Use Render backend for production, localhost for development
const api = axios.create({
  baseURL: process.env.NODE_ENV === 'production'
    ? 'https://flash-dash-backend.onrender.com'
    : 'http://localhost:8080'
});

api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem('token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

api.interceptors.response.use(
  (response) => {
    if (response?.data?.status === 'fallback') {
      window.dispatchEvent(
        new CustomEvent('api:fallback', {
          detail: { message: 'Cached data displayed' }
        })
      );
    }
    return response;
  },
  (error) => {
    const fallbackStatus = error?.response?.data?.status;
    if (fallbackStatus === 'fallback') {
      window.dispatchEvent(
        new CustomEvent('api:fallback', {
          detail: { message: 'Cached data displayed' }
        })
      );
    }
    return Promise.reject(error);
  }
);

export default api;
