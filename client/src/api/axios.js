import axios from 'axios';

// In dev the Vite proxy forwards /api to Express. Override with VITE_API_URL if the API is
// hosted elsewhere (then set COOKIE_SAMESITE / CLIENT_URL on the server accordingly).
const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  withCredentials: true, // send / receive the httpOnly auth cookie
  headers: { 'Content-Type': 'application/json' },
});

// The store is injected from main.jsx (avoids a circular import store <-> api).
let store;
export const injectStore = (s) => {
  store = s;
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    const isAuthCall = url.startsWith('/auth/');
    // An expired/revoked session on a normal request logs the user out everywhere in the UI.
    if (error.response?.status === 401 && !isAuthCall && store) {
      store.dispatch({ type: 'auth/sessionExpired' });
    }
    return Promise.reject(error);
  }
);

// Normalised error shape used by every thunk's rejectWithValue.
export const errorPayload = (error) => ({
  message: error.response?.data?.message || error.message || 'Something went wrong',
  errors: error.response?.data?.errors || [],
});

export default api;
