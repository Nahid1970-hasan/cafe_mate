import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_API_URL } from './config';

const api = axios.create({ timeout: 15000 });

api.interceptors.request.use(async (config) => {
  const stored = await AsyncStorage.getItem('api_url');
  config.baseURL = (stored || DEFAULT_API_URL).replace(/\/$/, '');
  const token = await AsyncStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const url = original?.url || '';
    const isAuth = url.includes('/api/auth/login') || url.includes('/api/auth/register');
    if (error.response?.status === 401 && original && !original._retry && !isAuth) {
      original._retry = true;
      await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user']);
      if (original.headers) delete original.headers.Authorization;
      return api(original);
    }
    return Promise.reject(error);
  },
);

export function errorDetail(error, fallback) {
  const detail = error?.response?.data?.detail;
  if (typeof detail === 'string' && detail.trim()) return detail;
  return fallback;
}

export const AuthApi = {
  login: (body) => api.post('/api/auth/login', body),
  register: (body) => api.post('/api/auth/register', body),
  me: () => api.get('/api/auth/me'),
};

export const CatalogApi = {
  categories: () => api.get('/api/categories'),
  products: (params) => api.get('/api/products', { params }),
  product: (id) => api.get(`/api/products/${id}`),
  customizations: (id) => api.get(`/api/products/${id}/customizations`),
};

export const OrderApi = {
  create: (body) => api.post('/api/orders', body),
  list: () => api.get('/api/orders'),
  detail: (id) => api.get(`/api/orders/${id}`),
};

export default api;
