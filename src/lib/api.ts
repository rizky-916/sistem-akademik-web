import axios from 'axios';
import { clearSession, getToken } from './session';

/**
 * Klien HTTP terpusat untuk Sistem Akademik API.
 * - Alamat API diambil dari NEXT_PUBLIC_API_URL (lihat .env.example).
 * - Token login otomatis disertakan di header Authorization.
 * - Jika token ditolak/kedaluwarsa (401), sesi dihapus dan pengguna diarahkan ke /login.
 */
export const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api').replace(/\/+$/, '');

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { Accept: 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const isLoginRequest = String(error?.config?.url || '').endsWith('/login');

    if (status === 401 && !isLoginRequest && typeof window !== 'undefined') {
      clearSession();
      if (window.location.pathname !== '/login') {
        window.location.replace('/login');
      }
    }
    return Promise.reject(error);
  }
);

export default api;

/** Status HTTP dari error axios (undefined jika server tidak bisa dihubungi). */
export function errorStatus(error: unknown): number | undefined {
  return axios.isAxiosError(error) ? error.response?.status : undefined;
}

/** Isi respons error dari API (mis. { message, errors }) jika ada. */
export function errorData(error: unknown): { message?: string; errors?: Record<string, string[]> } | undefined {
  return axios.isAxiosError(error) ? error.response?.data : undefined;
}
