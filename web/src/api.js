import axios from 'axios';

const api = axios.create({
  // Vite specific way to call the environment variable
  baseURL: import.meta.env.VITE_API_URL || 'https://regent-nexus-backend.onrender.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true // Essential for the CORS settings you just pushed
});

// Add the interceptor to attach the token from localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
