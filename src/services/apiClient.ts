import axios from 'axios';

/**
 * Pre-configured Axios instance for Phase 2 backend integration.
 * Currently unused — all calls go through mockApi.ts.
 *
 * Phase 2: update baseURL to the Express server address and
 * swap each mockApi function for an apiClient call.
 */
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach JWT token (Phase 2)
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('bms_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle 401s (Phase 2)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('bms_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
