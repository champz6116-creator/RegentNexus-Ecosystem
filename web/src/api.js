import axios from 'axios';

const api = axios.create({
  // 🌟 Zero-guesswork: Checks the actual browser address bar
  baseURL: window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'                     // Local Dev
    : 'https://regent-nexus-backend.onrender.com/api', // Render Live Prod
  timeout: 10000,
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
