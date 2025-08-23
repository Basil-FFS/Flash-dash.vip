import axios from 'axios';

// Production API URL - update this to your actual backend domain
const api = axios.create({ 
  baseURL: import.meta.env.VITE_API_BASE || 'https://api.flashdash.vip' 
});

api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem('token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

export default api;
