import axios from 'axios';

// Create axios instance with default timeout
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000, // 10 seconds timeout
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling token expiration and timeouts
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Handle server timeout
    if (error.code === 'ECONNABORTED' || !error.response) {
      console.error('Server connection timeout or server down');
      alert('Server connection timeout or server down')
      // You could show a notification to the user here
      return Promise.reject(new Error('Server is unreachable. Please try again later.'));
    }
    
    // Handle 401 Unauthorized errors (expired token)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Here you would typically refresh the token
      // For now, just redirect to login
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// Helper function to check if the server is available
export const checkServerHealth = async () => {
  try {
    await api.get('/health', { timeout: 5000 });
    return true;
  } catch (error) {
    console.log(error)
    return false;
  }
};

export default api;