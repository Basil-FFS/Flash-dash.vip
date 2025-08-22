import axios from 'axios';

// Use production API URL for production, fallback to localhost for development
const baseURL = import.meta.env.PROD 
  ? 'https://api.flashdash.vip'  // Production backend URL
  : 'http://localhost:8080';     // Development backend URL

const api = axios.create({ baseURL });

api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem('token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

export default api;
