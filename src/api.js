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

export default api;
