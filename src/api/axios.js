import axios from 'axios';

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    'http://localhost:5000/api',

  headers: {
    'Content-Type': 'application/json',
  },

  // Required for access_token cookie
  withCredentials: true,
});

// Automatically send CSRF token
// for state-changing requests.
api.interceptors.request.use(
  (config) => {
    const method = config.method?.toUpperCase();

    if (
      ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)
    ) {
      const match = document.cookie.match(
        /(?:^|;\s*)csrf_token=([^;]+)/
      );

      if (match) {
        config.headers['X-CSRF-Token'] =
          decodeURIComponent(match[1]);
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;