import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../api/api';

export default function Register() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [emailCode, setEmailCode] = useState('');

    const [isSendingCode, setIsSendingCode] = useState(false);
    const [codeSent, setCodeSent] = useState(false);

    // Состояния для ошибок валидации и сервера
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [serverError, setServerError] = useState('');
    const [serverMessage, setServerMessage] = useState('');

    const navigate = useNavigate();

    // Очистка ошибки конкретного поля при вводе
    const clearError = (field: string) => {
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
        setServerError('');
    };

    const handleSendCode = async () => {
        setServerError('');
        setServerMessage('');

        // Валидация только Email перед отправкой кода
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email.trim()) {
            setErrors(prev => ({ ...prev, email: 'Укажите email для получения кода' }));
            return;
        } else if (!emailRegex.test(email.trim())) {
            setErrors(prev => ({ ...prev, email: 'Некорректный формат почты (пример: name@mail.ru)' }));
            return;
        }

        try {
            setIsSendingCode(true);
            const res = await api.post('/auth/register/send-code', { email: email.trim() });
            setCodeSent(true);
            const devCode = res.data?.devCode;

            if (devCode) {
                setEmailCode(devCode);
                clearError('emailCode');
                setServerMessage(`SMTP не настроен. Dev-код: ${devCode}`);
            } else {
                setServerMessage('Код успешно отправлен на вашу почту!');
            }
        } catch (err: any) {
            setServerError(err.response?.data?.message || 'Не удалось отправить код. Проверьте почту.');
        } finally {
            setIsSendingCode(false);
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!email.trim()) {
            newErrors.email = 'Укажите email';
        } else if (!emailRegex.test(email.trim())) {
            newErrors.email = 'Некорректный формат почты';
        }

        if (!emailCode.trim()) {
            newErrors.emailCode = 'Введите код из письма';
        } else if (emailCode.trim().length < 4) {
            newErrors.emailCode = 'Проверьте правильность кода';
        }

        if (!username.trim()) {
            newErrors.username = 'Придумайте имя пользователя';
        } else if (username.trim().length < 3) {
            newErrors.username = 'Имя должно содержать минимум 3 символа';
        }

        if (!password) {
            newErrors.password = 'Придумайте пароль';
        } else if (password.length < 6) {
            newErrors.password = 'Пароль должен быть не короче 6 символов';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleRegister = async (event: React.FormEvent) => {
        event.preventDefault();
        setServerError('');
        setServerMessage('');

        if (!validateForm()) {
            return;
        }

        try {
            await api.post('/auth/register', {
                username: username.trim(),
                email: email.trim(),
                password,
                emailCode: emailCode.trim()
            });

            // В случае успеха можно сразу перекинуть на логин,
            // передав сообщение через state роутера, или просто показать alert
            alert('Регистрация успешна! Теперь вы можете войти.');
            navigate('/login');
        } catch (err: any) {
            setServerError(err.response?.data?.message || 'Ошибка регистрации. Проверьте введенные данные.');
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

                {/* Вывод серверных ошибок */}
                {serverError && (
                    <div className="mb-6 flex items-start gap-3 border-2 border-red-500 bg-red-50 p-4 text-red-900 font-bold">
                        <AlertCircle className="h-6 w-6 shrink-0 text-red-600" />
                        <span>{serverError}</span>
                    </div>
                )}

                {/* Вывод успешных сообщений от сервера (например, код отправлен) */}
                {serverMessage && (
                    <div className="mb-6 flex items-start gap-3 border-2 border-green-500 bg-green-50 p-4 text-green-900 font-bold">
                        <CheckCircle2 className="h-6 w-6 shrink-0 text-green-600" />
                        <span>{serverMessage}</span>
                    </div>
                )}

                <form onSubmit={handleRegister} className="space-y-5" noValidate>
                    <label className="block">
                        <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-[var(--muted)]">Email *</span>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="w-full">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={event => { setEmail(event.target.value); clearError('email'); }}
                                    className={`w-full border-2 bg-white px-5 py-4 text-lg font-bold outline-none focus:bg-[var(--sun)]/20 ${errors.email ? 'border-red-500 text-red-900 bg-red-50' : 'border-[var(--line)]'}`}
                                />
                            </div>
                            <button
                                type="button"
                                onClick={handleSendCode}
                                disabled={isSendingCode}
                                className="shrink-0 border-2 border-[var(--line)] bg-[var(--sun)] px-5 py-4 text-xs font-black uppercase tracking-[0.1em] hover:bg-[#e5b32e] transition-colors disabled:opacity-60"
                            >
                                {isSendingCode ? 'Отправка...' : (codeSent ? 'Отправить снова' : 'Отправить код')}
                            </button>
                        </div>
                        {errors.email && <span className="text-red-600 font-semibold text-sm mt-2 flex items-center gap-1"><AlertCircle size={16}/>{errors.email}</span>}
                    </label>

                    <label className="block">
                        <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-[var(--muted)]">Код из письма *</span>
                        <input
                            type="text"
                            value={emailCode}
                            onChange={event => { setEmailCode(event.target.value); clearError('emailCode'); }}
                            className={`w-full border-2 bg-white px-5 py-4 text-lg font-bold outline-none focus:bg-[var(--sun)]/20 tracking-widest ${errors.emailCode ? 'border-red-500 text-red-900 bg-red-50' : 'border-[var(--line)]'}`}
                        />
                        {errors.emailCode && <span className="text-red-600 font-semibold text-sm mt-2 flex items-center gap-1"><AlertCircle size={16}/>{errors.emailCode}</span>}
                    </label>

                    <label className="block">
                        <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-[var(--muted)]">Имя пользователя *</span>
                        <input
                            type="text"
                            value={username}
                            onChange={event => { setUsername(event.target.value); clearError('username'); }}
                            className={`w-full border-2 bg-white px-5 py-4 text-lg font-bold outline-none focus:bg-[var(--sun)]/20 ${errors.username ? 'border-red-500 text-red-900 bg-red-50' : 'border-[var(--line)]'}`}
                        />
                        {errors.username && <span className="text-red-600 font-semibold text-sm mt-2 flex items-center gap-1"><AlertCircle size={16}/>{errors.username}</span>}
                    </label>

                    <label className="block">
                        <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-[var(--muted)]">Пароль *</span>
                        <input
                            type="password"
                            value={password}
                            onChange={event => { setPassword(event.target.value); clearError('password'); }}
                            className={`w-full border-2 bg-white px-5 py-4 text-lg font-bold outline-none focus:bg-[var(--sun)]/20 ${errors.password ? 'border-red-500 text-red-900 bg-red-50' : 'border-[var(--line)]'}`}
                        />
                        {errors.password && <span className="text-red-600 font-semibold text-sm mt-2 flex items-center gap-1"><AlertCircle size={16}/>{errors.password}</span>}
                    </label>

                    <button type="submit" className="w-full border-2 border-[var(--line)] bg-[var(--coral)] px-6 py-5 font-black uppercase tracking-[0.14em] text-white hover:bg-[#d84a2f] transition-colors">
                        Зарегистрироваться
                    </button>
                </form>

                <p className="mt-6 text-center font-semibold text-[var(--muted)]">
                    Уже есть аккаунт?{' '}
                    <button className="font-black text-[var(--coral)] underline hover:no-underline" onClick={() => navigate('/login')}>
                        Войти
                    </button>
                </p>
            </section>
        </main>
    );
}