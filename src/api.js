import axios from 'axios';

// Use Render backend for production, localhost for development
const api = axios.create({
  baseURL: process.env.NODE_ENV === 'production'
    ? 'https://flash-dash-backend.onrender.com'
    : 'http://localhost:8080'
});

const emitFallbackNotice = (message = 'Cached data displayed') => {
  window.dispatchEvent(
    new CustomEvent('api:fallback', {
      detail: { message }
    })
  );
};

const emitRequestStatus = (type, message, config) => {
  if (!type) return;

  const detailMessage = message || (() => {
    const method = (config?.method || 'GET').toUpperCase();
    const endpoint = config?.url || 'request';
    return `${method} ${endpoint} ${type === 'error' ? 'failed' : 'succeeded'}`;
  })();

  window.dispatchEvent(
    new CustomEvent('api:status', {
      detail: {
        type,
        message: detailMessage
      }
    })
  );
};

const shouldAnnounceSuccess = (config) => {
  if (config?.showStatus === false) {
    return false;
  }

  if (config?.showStatus === true) {
    return true;
  }

  const method = (config?.method || 'get').toLowerCase();
  return method !== 'get';
};

api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem('token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

api.interceptors.response.use(
  (response) => {
    if (response?.data?.status === 'fallback') {
      emitFallbackNotice();
    }

    if (shouldAnnounceSuccess(response?.config)) {
      const successMessage = response?.data?.message;
      emitRequestStatus('success', successMessage, response?.config);
    }

    return response;
  },
  (error) => {
    const fallbackStatus = error?.response?.data?.status;
    if (fallbackStatus === 'fallback') {
      emitFallbackNotice();
    }

    if (error?.config?.showStatus !== false) {
      const failureMessage =
        error?.response?.data?.message ||
        error?.message ||
        null;
      emitRequestStatus('error', failureMessage, error?.config);
    }

    return Promise.reject(error);
  }
);

export default api;
