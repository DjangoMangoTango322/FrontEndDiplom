import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import { useState } from 'react';
import Toast, { type ToastState } from '../components/Toast';
import { CheckCircle2, Gift, Truck } from 'lucide-react';

const formatPrice = (value: number) => value.toLocaleString('ru-RU');

export default function Checkout() {
    const { cart, getTotal, clearCart } = useCart();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [successOrderId, setSuccessOrderId] = useState<number | null>(null);
    const [toast, setToast] = useState<ToastState>({ open: false, type: 'success', title: '' });

    const [form, setForm] = useState({
        name: '',
        phone: '',
        address: '',
        paymentMethod: 'card',
        isGift: false,
        giftRecipientName: '',
        giftRecipientEmail: '',
        giftFromName: '',
        giftMessage: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await api.post('/orders', {
                name: form.name,
                phone: form.phone,
                address: form.address,
                paymentMethod: form.paymentMethod,
                isGift: form.isGift,
                giftRecipientName: form.isGift ? form.giftRecipientName : null,
                giftRecipientEmail: form.isGift ? form.giftRecipientEmail : null,
                giftFromName: form.isGift ? form.giftFromName : null,
                giftMessage: form.isGift ? form.giftMessage : null,
                items: cart.map(item => ({
                    albumID: item.albumID,
                    quantity: item.quantity,
                    priceAtPurchase: item.price
                }))
            });

            clearCart();
            setSuccessOrderId(res.data.orderID);
        } catch (err: any) {
            setToast({
                open: true,
                type: 'error',
                title: 'Не удалось оформить заказ',
                description: err.response?.data?.message || 'Попробуйте ещё раз через пару секунд.'
            });
        } finally {
            setLoading(false);
        }
    };

    if (cart.length === 0 && !successOrderId) {
        return (
            <main className="mx-auto max-w-2xl px-5 py-20 text-center">
                <div className="bg-[var(--paper-soft)] p-8 poster-border">
                    <h1 className="display-font text-6xl leading-none">Корзина пуста</h1>
                    <button onClick={() => navigate('/')} className="mt-8 border-2 border-[var(--line)] bg-[var(--coral)] px-8 py-4 font-black uppercase tracking-[0.14em] text-white">
                        Перейти в каталог
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
                <div className="text-xs font-black uppercase tracking-[0.22em] text-[var(--coral)]">Checkout</div>
                <h1 className="display-font mt-2 text-6xl leading-none md:text-9xl">Оформление</h1>
            </div>

            <div className="grid gap-8 lg:grid-cols-12">
                <section className="bg-[var(--paper-soft)] p-6 poster-border-sm md:p-8 lg:col-span-7">
                    <div className="mb-7 flex items-center gap-3">
                        <Truck className="h-7 w-7 text-[var(--coral)]" />
                        <h2 className="display-font text-4xl leading-none">Доставка</h2>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <label className="block">
                            <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-[var(--muted)]">Имя и фамилия</span>
                            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full border-2 border-[var(--line)] bg-white px-5 py-4 text-lg font-bold outline-none focus:bg-[var(--sun)]/20" required />
                        </label>

                        <label className="block">
                            <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-[var(--muted)]">Телефон</span>
                            <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full border-2 border-[var(--line)] bg-white px-5 py-4 text-lg font-bold outline-none focus:bg-[var(--sun)]/20" required />
                        </label>

                        <label className="block">
                            <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-[var(--muted)]">Адрес доставки</span>
                            <textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} rows={3} className="w-full resize-y border-2 border-[var(--line)] bg-white px-5 py-4 text-lg font-bold outline-none focus:bg-[var(--sun)]/20" required />
                        </label>

                        <label className="block">
                            <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-[var(--muted)]">Способ оплаты</span>
                            <select value={form.paymentMethod} onChange={e => setForm({ ...form, paymentMethod: e.target.value })} className="w-full border-2 border-[var(--line)] bg-white px-5 py-4 text-lg font-bold outline-none">
                                <option value="card">Банковской картой</option>
                                <option value="cash">Наличными при получении</option>
                                <option value="sbp">СБП</option>
                            </select>
                        </label>

                        <div className="border-y-2 border-[var(--line)] py-5">
                            <label className="flex items-center gap-3 font-black">
                                <input type="checkbox" checked={form.isGift} onChange={e => setForm({ ...form, isGift: e.target.checked })} className="h-5 w-5 accent-[var(--coral)]" />
                                <Gift className="h-5 w-5 text-[var(--coral)]" />
                                Купить в подарок
                            </label>

                            {form.isGift && (
                                <div className="mt-5 grid gap-4 md:grid-cols-2">
                                    <input placeholder="Имя получателя" value={form.giftRecipientName} onChange={e => setForm({ ...form, giftRecipientName: e.target.value })} className="border-2 border-[var(--line)] bg-white px-5 py-4 font-bold outline-none" required />
                                    <input placeholder="Email получателя" type="email" value={form.giftRecipientEmail} onChange={e => setForm({ ...form, giftRecipientEmail: e.target.value })} className="border-2 border-[var(--line)] bg-white px-5 py-4 font-bold outline-none" />
                                    <input placeholder="От кого" value={form.giftFromName} onChange={e => setForm({ ...form, giftFromName: e.target.value })} className="border-2 border-[var(--line)] bg-white px-5 py-4 font-bold outline-none" />
                                    <textarea placeholder="Сообщение к подарку" value={form.giftMessage} onChange={e => setForm({ ...form, giftMessage: e.target.value })} rows={3} className="border-2 border-[var(--line)] bg-white px-5 py-4 font-bold outline-none md:col-span-2" />
                                </div>
                            )}
                        </div>

                        <button type="submit" disabled={loading} className="w-full border-2 border-[var(--line)] bg-[var(--coral)] px-6 py-5 font-black uppercase tracking-[0.14em] text-white disabled:opacity-60">
                            {loading ? 'Оформляем заказ...' : 'Подтвердить заказ'}
                        </button>
                    </form>
                </section>

                <aside className="lg:col-span-5">
                    <div className="sticky top-28 bg-[var(--ink)] p-7 text-white poster-border">
                        <h2 className="display-font text-4xl leading-none">Ваш заказ</h2>
                        <div className="mt-7 space-y-4">
                            {cart.map(item => (
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
                            <span className="display-font text-4xl leading-none">{formatPrice(getTotal())} ₽</span>
                        </div>
                        <p className="mt-3 text-sm text-[var(--sun)]">Доставка бесплатная.</p>
                    </div>
                </aside>
            </div>
            <Toast {...toast} onClose={() => setToast(t => ({ ...t, open: false }))} />
        </main>
    );
}
