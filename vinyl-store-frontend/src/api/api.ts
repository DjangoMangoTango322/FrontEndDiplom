import axios, { type InternalAxiosRequestConfig, type AxiosError } from 'axios';

//https://vynil.somee.com/api
const API_BASE = (import.meta.env.VITE_API_URL as string) || 'https://vynil.somee.com/api';

const api = axios.create({
    baseURL: API_BASE,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: false
});


api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});


api.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            localStorage.removeItem('username');

            if (window.location.pathname !== '/login') {
                const next = `${window.location.pathname}${window.location.search}`;
                window.location.href = `/login?next=${encodeURIComponent(next)}`;
            }
        }
        return Promise.reject(error);
    }
);

export default api;
