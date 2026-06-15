import axios, { type InternalAxiosRequestConfig, type AxiosError } from 'axios';
import toast from 'react-hot-toast';
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

             toast.error('Сессия истекла. Пожалуйста, авторизуйтесь снова.');

            if (window.location.pathname !== '/login') {
                const next = `${window.location.pathname}${window.location.search}`;

                 setTimeout(() => {
                    window.location.href = `/login?next=${encodeURIComponent(next)}`;
                }, 1500);
            }
        }
           else if (error.response?.status && error.response.status >= 400 && error.response.status < 500) {
            const data = error.response.data as any;

            if (data?.message) {
                toast.error(data.message);
            } else {
                toast.error('Произошла ошибка при выполнении запроса');
            }
        }
        else if (!error.response) {
            toast.error('Ошибка соединения с сервером');
        }

        return Promise.reject(error);
    }
);

export default api;