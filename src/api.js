import axios from 'axios';

// Use Netlify Functions instead of localhost
const api = axios.create({ 
  baseURL: import.meta.env.VITE_API_BASE || '/.netlify/functions' 
});

api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem('token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

export default api;
