import axios from 'axios';

// Use localhost for development, production API for production
const api = axios.create({ 
  baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:8081' 
});

api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem('token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

export default api;
