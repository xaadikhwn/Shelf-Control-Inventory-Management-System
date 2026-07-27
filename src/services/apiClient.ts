import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 10000,
  withCredentials: true, // Necessary for cookies (Refresh Token)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach JWT token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('bms_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle 401s (Refresh logic could be added here later)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // If we get a 401 and we have a token, we might need to refresh
    // For now, if 401, we just force a re-login
    if (error.response?.status === 401) {
      // Avoid infinite loops by checking if the request was the login/refresh itself
      if (!error.config.url?.includes('auth')) {
        localStorage.removeItem('bms_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
