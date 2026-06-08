import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';

export default function Register() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [emailCode, setEmailCode] = useState('');
    const [isSendingCode, setIsSendingCode] = useState(false);
    const [codeSent, setCodeSent] = useState(false);
    const navigate = useNavigate();

    const handleSendCode = async () => {
        if (!email.trim()) {
            alert('Сначала введите email');
            return;
        }

        try {
            setIsSendingCode(true);
            const res = await api.post('/auth/register/send-code', { email });
            setCodeSent(true);
            const devCode = res.data?.devCode;
            if (devCode) {
                setEmailCode(devCode);
                alert(`SMTP не настроен. Dev-код: ${devCode}`);
            } else {
                alert('Код отправлен на почту');
            }
        } catch (err: any) {
            alert(err.response?.data?.message || 'Не удалось отправить код');
        } finally {
            setIsSendingCode(false);
        }
    };

    const handleRegister = async (event: React.FormEvent) => {
        event.preventDefault();
        try {
            await api.post('/auth/register', { username, email, password, emailCode });
            alert('Регистрация успешна. Теперь войдите.');
            navigate('/login');
        } catch (err: any) {
            alert(err.response?.data?.message || 'Ошибка регистрации');
        }
    };

    return (
        <main className="mx-auto grid min-h-[74vh] max-w-6xl items-center gap-10 px-5 py-14 md:px-8 lg:grid-cols-2">
            <section>
                <div className="text-xs font-black uppercase tracking-[0.24em] text-[var(--coral)]">Новый покупатель</div>
                <h1 className="display-font mt-4 text-7xl leading-none md:text-9xl">Создать аккаунт</h1>
                <p className="mt-5 max-w-xl text-xl leading-8 text-[var(--muted)]">
                    Аккаунт нужен, чтобы оформлять заказы на пластинки, отслеживать покупки и получать подборки винила под свой вкус.
                </p>
            </section>

            <section className="bg-[var(--paper-soft)] p-6 poster-border md:p-8">
                <form onSubmit={handleRegister} className="space-y-5">
                    <label className="block">
                        <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-[var(--muted)]">Email</span>
                        <div className="flex gap-3">
                            <input
                                type="email"
                                value={email}
                                onChange={event => setEmail(event.target.value)}
                                className="w-full border-2 border-[var(--line)] bg-white px-5 py-4 text-lg font-bold outline-none focus:bg-[var(--sun)]/20"
                                required
                            />
                            <button
                                type="button"
                                onClick={handleSendCode}
                                disabled={isSendingCode}
                                className="shrink-0 border-2 border-[var(--line)] bg-[var(--sun)] px-5 py-4 text-xs font-black uppercase tracking-[0.1em] disabled:opacity-60"
                            >
                                {isSendingCode ? 'Отправка...' : (codeSent ? 'Отправить снова' : 'Отправить код')}
                            </button>
                        </div>
                    </label>

                    <label className="block">
                        <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-[var(--muted)]">Код из письма</span>
                        <input
                            type="text"
                            value={emailCode}
                            onChange={event => setEmailCode(event.target.value)}
                            className="w-full border-2 border-[var(--line)] bg-white px-5 py-4 text-lg font-bold outline-none focus:bg-[var(--sun)]/20"
                            required
                        />
                    </label>

                    <label className="block">
                        <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-[var(--muted)]">Имя пользователя</span>
                        <input
                            type="text"
                            value={username}
                            onChange={event => setUsername(event.target.value)}
                            className="w-full border-2 border-[var(--line)] bg-white px-5 py-4 text-lg font-bold outline-none focus:bg-[var(--sun)]/20"
                            required
                        />
                    </label>

                    <label className="block">
                        <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-[var(--muted)]">Пароль</span>
                        <input
                            type="password"
                            value={password}
                            onChange={event => setPassword(event.target.value)}
                            className="w-full border-2 border-[var(--line)] bg-white px-5 py-4 text-lg font-bold outline-none focus:bg-[var(--sun)]/20"
                            required
                        />
                    </label>
                    <button type="submit" className="w-full border-2 border-[var(--line)] bg-[var(--coral)] px-6 py-5 font-black uppercase tracking-[0.14em] text-white">
                        Зарегистрироваться
                    </button>
                </form>
                <p className="mt-6 text-center font-semibold text-[var(--muted)]">
                    Уже есть аккаунт?{' '}
                    <button className="font-black text-[var(--coral)] underline" onClick={() => navigate('/login')}>
                        Войти
                    </button>
                </p>
            </section>
        </main>
    );
}
