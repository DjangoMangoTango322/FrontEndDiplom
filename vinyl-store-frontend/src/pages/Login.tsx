import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AxiosError } from 'axios';
import api from '../api/api';
import { Disc3, Music2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSpotifyLoading, setIsSpotifyLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const getPostLoginTarget = () => {
        const params = new URLSearchParams(window.location.search);
        return params.get('next') || '/';
    };

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        const role = params.get('userRole');
        const username = params.get('username');

        if (token && role && username) {
            login(token, role, username);
            navigate(getPostLoginTarget(), { replace: true });
        }
    }, [navigate, login]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await api.post('/auth/login', { email, password });
            login(res.data.token, res.data.userRole || res.data.role, res.data.username);
            navigate(getPostLoginTarget());
        } catch {
            alert('Неверный логин или пароль');
        }
    };

    const handleSpotifyLogin = async () => {
        try {
            setIsSpotifyLoading(true);
            const state = window.location.origin;
            const res = await api.get('/auth/spotify/login', { params: { state } });
            window.location.href = res.data.authUrl;
        } catch (error) {
            const axiosError = error as AxiosError<{ message?: string }>;
            alert(axiosError.response?.data?.message || 'Не удалось начать вход через Spotify');
        } finally {
            setIsSpotifyLoading(false);
        }
    };

    return (
        <main className="mx-auto grid min-h-[74vh] max-w-6xl items-center gap-10 px-5 py-14 md:px-8 lg:grid-cols-2">
            <section>
                <div className="inline-grid h-16 w-16 place-items-center rounded-full border-2 border-[var(--line)] bg-[var(--sun)]">
                    <Disc3 className="h-9 w-9" />
                </div>
                <h1 className="display-font mt-6 text-7xl leading-none md:text-9xl">Вход в магазин</h1>
                <p className="mt-5 max-w-xl text-xl leading-8 text-[var(--muted)]">
                    Авторизуйтесь, чтобы видеть свои заказы, Spotify-рекомендации и быстрее оформлять новые пластинки.
                </p>
            </section>

            <section className="bg-[var(--paper-soft)] p-6 poster-border md:p-8">
                <form onSubmit={handleLogin} className="space-y-5">
                    <label className="block">
                        <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-[var(--muted)]">Email</span>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full border-2 border-[var(--line)] bg-white px-5 py-4 text-lg font-bold outline-none focus:bg-[var(--sun)]/20"
                            required
                        />
                    </label>
                    <label className="block">
                        <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-[var(--muted)]">Пароль</span>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full border-2 border-[var(--line)] bg-white px-5 py-4 text-lg font-bold outline-none focus:bg-[var(--sun)]/20"
                            required
                        />
                    </label>
                    <button type="submit" className="w-full border-2 border-[var(--line)] bg-[var(--ink)] px-6 py-5 font-black uppercase tracking-[0.14em] text-white">
                        Войти
                    </button>
                </form>

                <div className="my-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                    <div className="h-0.5 bg-[var(--line)]" />
                    <span className="text-xs font-black uppercase tracking-[0.18em] text-[var(--muted)]">или</span>
                    <div className="h-0.5 bg-[var(--line)]" />
                </div>

                <button
                    type="button"
                    disabled={isSpotifyLoading}
                    onClick={handleSpotifyLogin}
                    className="flex w-full items-center justify-center gap-3 border-2 border-[var(--line)] bg-[#1db954] px-6 py-5 font-black uppercase tracking-[0.12em] text-[var(--ink)] disabled:opacity-60"
                >
                    <Music2 className="h-5 w-5" />
                    {isSpotifyLoading ? 'Подключаем Spotify...' : 'Войти через Spotify'}
                </button>

                <p className="mt-6 text-center font-semibold text-[var(--muted)]">
                    Нет аккаунта?{' '}
                    <button className="font-black text-[var(--coral)] underline" onClick={() => navigate('/register')}>
                        Зарегистрироваться
                    </button>
                </p>
            </section>
        </main>
    );
}
