import axios from 'axios';

// Use Render backend for production, localhost for development
const api = axios.create({ 
  baseURL: import.meta.env.VITE_API_BASE || 'https://flash-dash-backend.onrender.com' 
});

api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem('token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

export default api;
