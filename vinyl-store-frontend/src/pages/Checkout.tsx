import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, Gift, Truck, AlertCircle } from 'lucide-react';
import { AddressSuggestions } from 'react-dadata';
import 'react-dadata/dist/react-dadata.css';
import api from '../api/api';
import Toast, { type ToastState } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const formatPrice = (value: number) => value.toLocaleString('ru-RU');

// Ваш API ключ DaData
const DADATA_API_KEY = "c560feed5b5c24e324ebaaf1f0fd54ecd8aae7a2";

export default function Checkout() {
    const { isAuthenticated } = useAuth();
    const { cart, clearCart, getTotal, isCartLoading, refreshCart, usesServerCart } = useCart();
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(false);
    const [successOrderId, setSuccessOrderId] = useState<number | null>(null);
    const [toast, setToast] = useState<ToastState>({ open: false, type: 'success', title: '' });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const selectedParam = new URLSearchParams(location.search).get('selected');
    const selectedAlbumIds = selectedParam
        ? selectedParam.split(',').map(value => Number(value)).filter(value => Number.isFinite(value) && value > 0)
        : [];

    const selectedItems = useMemo(() => {
        if (selectedAlbumIds.length === 0) return cart;
        const selectedSet = new Set(selectedAlbumIds);
        const filtered = cart.filter(item => selectedSet.has(item.albumID));
        return filtered.length > 0 ? filtered : cart;
    }, [cart, selectedAlbumIds]);

    const total = getTotal(selectedItems);

    const [form, setForm] = useState({
        name: '',
        phone: '',
        address: '',
        paymentMethod: 'card',
        isGift: false,
        giftRecipientName: '',
        giftRecipientEmail: '',
        giftFromName: '',
        giftMessage: '',
    });

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        const hasDigits = /\d/;

        // 1. Имя и Фамилия (строгая проверка на 2 слова)
        const nameParts = form.name.trim().split(/\s+/); // Разбиваем по пробелам

        if (!form.name.trim()) {
            newErrors.name = 'Укажите ваше имя и фамилию';
        } else if (nameParts.length < 2) {
            newErrors.name = 'Укажите и имя, и фамилию (через пробел)';
        } else if (hasDigits.test(form.name)) {
            newErrors.name = 'Имя и фамилия не могут содержать цифры';
        }

        // 2. Телефон
        const digitsOnly = form.phone.replace(/\D/g, '');
        if (!form.phone.trim()) {
            newErrors.phone = 'Укажите номер телефона';
        } else if (digitsOnly.length < 10 || digitsOnly.length > 15) {
            newErrors.phone = 'Некорректный номер (введите телефон полностью)';
        }

        // 3. Адрес
        if (!form.address.trim()) {
            newErrors.address = 'Начните вводить и выберите адрес из списка';
        }

        // 4. Подарок
        if (form.isGift) {
            // Имя получателя (здесь разрешаем 1 слово)
            if (!form.giftRecipientName.trim()) {
                newErrors.giftRecipientName = 'Укажите, кому достанется подарок';
            } else if (hasDigits.test(form.giftRecipientName)) {
                newErrors.giftRecipientName = 'Имя не может содержать цифры';
            }

            // Email получателя
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (form.giftRecipientEmail.trim() && !emailRegex.test(form.giftRecipientEmail.trim())) {
                newErrors.giftRecipientEmail = 'Некорректный формат почты (пример: name@mail.ru)';
            }

            // От кого
            if (form.giftFromName.trim() && hasDigits.test(form.giftFromName)) {
                newErrors.giftFromName = 'Имя отправителя не может содержать цифры';
            }

            // Сообщение
            if (form.giftMessage.trim() && hasDigits.test(form.giftMessage)) {
                newErrors.giftMessage = 'Сообщение не может содержать цифры';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const clearError = (field: string) => {
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLFormElement>) => {
        if (event.key === 'Enter' && (event.target as HTMLElement).tagName === 'INPUT') {
            event.preventDefault();
        }
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!isAuthenticated) {
            navigate(`/login?next=${encodeURIComponent(`${location.pathname}${location.search}`)}`);
            return;
        }

        if (selectedItems.length === 0) return;

        if (!validateForm()) return;

        setLoading(true);

        try {
            const payload = {
                name: form.name.trim(), // Убираем лишние пробелы по краям перед отправкой
                phone: form.phone,
                address: form.address,
                paymentMethod: form.paymentMethod,
                isGift: form.isGift,
                giftRecipientName: form.isGift ? form.giftRecipientName.trim() : null,
                giftRecipientEmail: form.isGift ? form.giftRecipientEmail.trim() : null,
                giftFromName: form.isGift ? form.giftFromName.trim() : null,
                giftMessage: form.isGift ? form.giftMessage.trim() : null,
            };

            const cartItemIds = selectedItems
                .map(item => item.cartItemId)
                .filter((value): value is number => typeof value === 'number');

            const response = usesServerCart && cartItemIds.length === selectedItems.length
                ? await api.post('/cart/checkout', { ...payload, cartItemIds })
                : await api.post('/orders', {
                    ...payload,
                    items: selectedItems.map(item => ({
                        albumID: item.albumID,
                        quantity: item.quantity,
                        priceAtPurchase: item.price,
                    })),
                });

            if (usesServerCart) {
                await refreshCart();
            } else {
                await clearCart();
            }

            setSuccessOrderId(response.data.orderId ?? response.data.orderID ?? null);
        } catch (error) {
            const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
            setToast({
                open: true,
                type: 'error',
                title: 'Не удалось оформить заказ',
                description: message || 'Попробуйте еще раз через пару секунд.',
            });
        } finally {
            setLoading(false);
        }
    };

    if (isCartLoading) {
        return (
            <main className="mx-auto max-w-4xl px-5 py-20">
                <div className="poster-border bg-[var(--paper-soft)] p-8 text-center font-bold">
                    Подготавливаем корзину к оформлению...
                </div>
            </main>
        );
    }

    if (!isAuthenticated && !successOrderId) {
        return (
            <main className="mx-auto max-w-3xl px-5 py-20 text-center">
                <div className="bg-[var(--paper-soft)] p-8 poster-border">
                    <h1 className="display-font text-6xl leading-none">Нужен вход в аккаунт</h1>
                    <p className="mx-auto mt-5 max-w-xl text-lg leading-7 text-[var(--muted)]">
                        Чтобы оформить заказ и сохранить историю покупок, сначала войдите в аккаунт. Корзина никуда не исчезнет.
                    </p>
                    <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                        <button onClick={() => navigate(`/login?next=${encodeURIComponent(`${location.pathname}${location.search}`)}`)} className="border-2 border-[var(--line)] bg-[var(--ink)] px-8 py-4 font-black uppercase tracking-[0.14em] text-white">
                            Войти
                        </button>
                        <button onClick={() => navigate('/cart')} className="border-2 border-[var(--line)] bg-[var(--sun)] px-8 py-4 font-black uppercase tracking-[0.14em]">
                            Вернуться в корзину
                        </button>
                    </div>
                </div>
            </main>
        );
    }

    if (selectedItems.length === 0 && !successOrderId) {
        return (
            <main className="mx-auto max-w-2xl px-5 py-20 text-center">
                <div className="bg-[var(--paper-soft)] p-8 poster-border">
                    <h1 className="display-font text-6xl leading-none">Нечего оформлять</h1>
                    <button onClick={() => navigate('/cart')} className="mt-8 border-2 border-[var(--line)] bg-[var(--coral)] px-8 py-4 font-black uppercase tracking-[0.14em] text-white">
                        Вернуться в корзину
                    </button>
                </div>
            </main>
        );
    }

    if (successOrderId) {
        return (
            <main className="mx-auto max-w-4xl px-5 py-20">
                <div className="bg-[var(--paper-soft)] p-8 poster-border md:p-10">
                    <CheckCircle2 className="h-16 w-16 text-[var(--coral)]" />
                    <h1 className="display-font mt-6 text-6xl leading-none md:text-8xl">Заказ оформлен</h1>
                    <p className="mt-5 text-xl leading-8 text-[var(--muted)]">
                        Спасибо! Мы приняли заказ <span className="font-black text-[var(--ink)]">#{successOrderId}</span> и уже начали обработку.
                    </p>
                    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                        <button onClick={() => navigate('/orders')} className="border-2 border-[var(--line)] bg-[var(--ink)] px-7 py-4 font-black uppercase tracking-[0.13em] text-white">
                            Мои заказы
                        </button>
                        <button onClick={() => navigate('/')} className="border-2 border-[var(--line)] bg-[var(--sun)] px-7 py-4 font-black uppercase tracking-[0.13em]">
                            Вернуться в каталог
                        </button>
                    </div>
                </div>
                <Toast {...toast} onClose={() => setToast(t => ({ ...t, open: false }))} />
            </main>
        );
    }

    return (
        <main className="mx-auto max-w-7xl px-5 py-12 md:px-8">
            <div className="mb-10 border-b-2 border-[var(--line)] pb-8">
                <div className="text-xs font-black uppercase tracking-[0.22em] text-[var(--coral)]">Заказ пластинок</div>
                <h1 className="display-font mt-2 text-6xl leading-none md:text-9xl">Оформление</h1>
                {selectedItems.length !== cart.length && (
                    <p className="mt-4 text-lg font-semibold text-[var(--muted)]">
                        Оформляем только выбранные позиции из корзины.
                    </p>
                )}
            </div>

            <div className="grid gap-8 lg:grid-cols-12">
                <section className="bg-[var(--paper-soft)] p-6 poster-border-sm md:p-8 lg:col-span-7">
                    <div className="mb-7 flex items-center gap-3">
                        <Truck className="h-7 w-7 text-[var(--coral)]" />
                        <h2 className="display-font text-4xl leading-none">Доставка</h2>
                    </div>

                    <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="space-y-5" noValidate>

                        <label className="block">
                            <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-[var(--muted)]">Имя и фамилия</span>
                            <input
                                value={form.name}
                                onChange={event => { setForm({ ...form, name: event.target.value }); clearError('name'); }}
                                className={`w-full border-2 bg-white px-5 py-4 text-lg font-bold outline-none focus:bg-[var(--sun)]/20 ${errors.name ? 'border-red-500 text-red-900 bg-red-50' : 'border-[var(--line)]'}`}
                            />
                            {errors.name && <span className="text-red-600 font-semibold text-sm mt-2 flex items-center gap-1"><AlertCircle size={16}/>{errors.name}</span>}
                        </label>

                        <label className="block">
                            <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-[var(--muted)]">Телефон</span>
                            <input
                                type="tel"
                                placeholder="+7 (___) ___-__-__"
                                value={form.phone}
                                onChange={event => { setForm({ ...form, phone: event.target.value }); clearError('phone'); }}
                                className={`w-full border-2 bg-white px-5 py-4 text-lg font-bold outline-none focus:bg-[var(--sun)]/20 ${errors.phone ? 'border-red-500 text-red-900 bg-red-50' : 'border-[var(--line)]'}`}
                            />
                            {errors.phone && <span className="text-red-600 font-semibold text-sm mt-2 flex items-center gap-1"><AlertCircle size={16}/>{errors.phone}</span>}
                        </label>

                        <label className="block">
                            <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-[var(--muted)]">Адрес доставки</span>
                            <div className={`border-2 bg-white focus-within:bg-[var(--sun)]/20 ${errors.address ? 'border-red-500 bg-red-50' : 'border-[var(--line)]'}`}>
                                <AddressSuggestions
                                    token={DADATA_API_KEY}
                                    onChange={(suggestion) => {
                                        setForm({ ...form, address: suggestion?.value || '' });
                                        clearError('address');
                                    }}
                                    inputProps={{
                                        placeholder: 'Начните вводить город и улицу...',
                                        className: `w-full px-5 py-4 text-lg font-bold outline-none bg-transparent ${errors.address ? 'text-red-900' : ''}`,
                                    }}
                                />
                            </div>
                            {errors.address && <span className="text-red-600 font-semibold text-sm mt-2 flex items-center gap-1"><AlertCircle size={16}/>{errors.address}</span>}
                        </label>

                        <label className="block">
                            <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-[var(--muted)]">Способ оплаты</span>
                            <select value={form.paymentMethod} onChange={event => setForm({ ...form, paymentMethod: event.target.value })} className="w-full border-2 border-[var(--line)] bg-white px-5 py-4 text-lg font-bold outline-none cursor-pointer focus:bg-[var(--sun)]/20">
                                <option value="card">Банковской картой</option>
                                <option value="cash">Наличными при получении</option>
                                <option value="sbp">СБП</option>
                            </select>
                        </label>

                        <div className="border-y-2 border-[var(--line)] py-5">
                            <label className="flex items-center gap-3 font-black cursor-pointer">
                                <input type="checkbox" checked={form.isGift} onChange={event => { setForm({ ...form, isGift: event.target.checked }); clearError('giftRecipientName'); }} className="h-5 w-5 accent-[var(--coral)]" />
                                <Gift className="h-5 w-5 text-[var(--coral)]" />
                                Купить в подарок
                            </label>

                            {form.isGift && (
                                <div className="mt-5 grid gap-4 md:grid-cols-2">
                                    <div className="md:col-span-1">
                                        <input
                                            placeholder="Имя получателя *"
                                            value={form.giftRecipientName}
                                            onChange={event => { setForm({ ...form, giftRecipientName: event.target.value }); clearError('giftRecipientName'); }}
                                            className={`w-full border-2 bg-white px-5 py-4 font-bold outline-none focus:bg-[var(--sun)]/20 ${errors.giftRecipientName ? 'border-red-500 bg-red-50' : 'border-[var(--line)]'}`}
                                        />
                                        {errors.giftRecipientName && <span className="text-red-600 font-semibold text-xs mt-2 flex items-center gap-1"><AlertCircle size={14}/>{errors.giftRecipientName}</span>}
                                    </div>

                                    <div className="md:col-span-1">
                                        <input
                                            placeholder="Email получателя"
                                            type="email"
                                            value={form.giftRecipientEmail}
                                            onChange={event => { setForm({ ...form, giftRecipientEmail: event.target.value }); clearError('giftRecipientEmail'); }}
                                            className={`w-full border-2 bg-white px-5 py-4 font-bold outline-none focus:bg-[var(--sun)]/20 ${errors.giftRecipientEmail ? 'border-red-500 bg-red-50' : 'border-[var(--line)]'}`}
                                        />
                                        {errors.giftRecipientEmail && <span className="text-red-600 font-semibold text-xs mt-2 flex items-center gap-1"><AlertCircle size={14}/>{errors.giftRecipientEmail}</span>}
                                    </div>

                                    <div className="md:col-span-2">
                                        <input
                                            placeholder="От кого"
                                            value={form.giftFromName}
                                            onChange={event => { setForm({ ...form, giftFromName: event.target.value }); clearError('giftFromName'); }}
                                            className={`w-full border-2 bg-white px-5 py-4 font-bold outline-none focus:bg-[var(--sun)]/20 ${errors.giftFromName ? 'border-red-500 bg-red-50' : 'border-[var(--line)]'}`}
                                        />
                                        {errors.giftFromName && <span className="text-red-600 font-semibold text-xs mt-2 flex items-center gap-1"><AlertCircle size={14}/>{errors.giftFromName}</span>}
                                    </div>

                                    <div className="md:col-span-2">
                                        <textarea
                                            placeholder="Сообщение к подарку"
                                            value={form.giftMessage}
                                            onChange={event => { setForm({ ...form, giftMessage: event.target.value }); clearError('giftMessage'); }}
                                            rows={3}
                                            className={`w-full border-2 bg-white px-5 py-4 font-bold outline-none focus:bg-[var(--sun)]/20 ${errors.giftMessage ? 'border-red-500 bg-red-50' : 'border-[var(--line)]'}`}
                                        />
                                        {errors.giftMessage && <span className="text-red-600 font-semibold text-xs mt-2 flex items-center gap-1"><AlertCircle size={14}/>{errors.giftMessage}</span>}
                                    </div>
                                </div>
                            )}
                        </div>

                        <button type="submit" disabled={loading} className="w-full border-2 border-[var(--line)] bg-[var(--coral)] px-6 py-5 font-black uppercase tracking-[0.14em] text-white disabled:opacity-60 hover:bg-[#d84a2f] transition-colors">
                            {loading ? 'Оформляем заказ...' : 'Подтвердить заказ'}
                        </button>
                    </form>
                </section>

                <aside className="lg:col-span-5">
                    <div className="sticky top-28 bg-[var(--ink)] p-7 text-white poster-border">
                        <h2 className="display-font text-4xl leading-none">Ваш заказ</h2>
                        <div className="mt-7 space-y-4">
                            {selectedItems.map(item => (
                                <div key={item.albumID} className="flex justify-between gap-4 border-b-2 border-white/15 pb-4">
                                    <div>
                                        <div className="font-black">{item.title}</div>
                                        <div className="text-sm text-white/55">x {item.quantity}</div>
                                    </div>
                                    <div className="font-black tabular-nums">{formatPrice(item.price * item.quantity)} ₽</div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-7 flex justify-between border-t-2 border-white pt-5">
                            <span className="font-black uppercase tracking-[0.16em]">Итого</span>
                            <span className="display-font text-4xl leading-none">{formatPrice(total)} ₽</span>
                        </div>
                        <p className="mt-3 text-sm text-[var(--sun)]">Доставка бесплатная.</p>
                    </div>
                </aside>
            </div>
            <Toast {...toast} onClose={() => setToast(t => ({ ...t, open: false }))} />
        </main>
    );
}