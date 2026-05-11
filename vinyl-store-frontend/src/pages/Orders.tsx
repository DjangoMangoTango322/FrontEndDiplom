import { useEffect, useMemo, useState } from 'react';
import api from '../api/api';
import type { Order } from '../types';
import { Calendar, Package, Pencil, Trash2, X } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import Toast, { type ToastState } from '../components/Toast';

export default function Orders() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState<Order | null>(null);
    const [saving, setSaving] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState<Order | null>(null);
    const [deleting, setDeleting] = useState(false);
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

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const res = await api.get<Order[]>('/orders');
                setOrders(res.data);
            } catch (err) {
                console.error('Ошибка загрузки заказов:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, []);

    const canManage = useMemo(() => (o: Order) => o.status === 'Pending', []);

    const openEdit = (order: Order) => {
        setEditing(order);
        setForm({
            name: (order as any).customerName || '',
            phone: (order as any).customerPhone || '',
            address: (order as any).deliveryAddress || '',
            paymentMethod: (order as any).paymentMethod || 'card',
            isGift: Boolean((order as any).isGift),
            giftRecipientName: (order as any).giftRecipientName || '',
            giftRecipientEmail: (order as any).giftRecipientEmail || '',
            giftFromName: (order as any).giftFromName || '',
            giftMessage: (order as any).giftMessage || ''
        });
    };

    const saveEdit = async () => {
        if (!editing) return;
        try {
            setSaving(true);
            await api.put(`/orders/${editing.orderID}`, {
                name: form.name,
                phone: form.phone,
                address: form.address,
                paymentMethod: form.paymentMethod,
                isGift: form.isGift,
                giftRecipientName: form.isGift ? form.giftRecipientName : null,
                giftRecipientEmail: form.isGift ? form.giftRecipientEmail : null,
                giftFromName: form.isGift ? form.giftFromName : null,
                giftMessage: form.isGift ? form.giftMessage : null
            });
            const res = await api.get<Order[]>('/orders');
            setOrders(res.data);
            setEditing(null);
            setToast({ open: true, type: 'success', title: 'Заказ обновлён', description: 'Данные доставки сохранены.' });
        } catch (err: any) {
            setToast({
                open: true,
                type: 'error',
                title: 'Не удалось сохранить',
                description: err.response?.data?.message || 'Попробуйте ещё раз.'
            });
        } finally {
            setSaving(false);
        }
    };

    const deleteOrder = async () => {
        if (!confirmDelete) return;
        try {
            setDeleting(true);
            await api.delete(`/orders/${confirmDelete.orderID}`);
            setOrders(prev => prev.filter(o => o.orderID !== confirmDelete.orderID));
            setToast({ open: true, type: 'success', title: 'Заказ удалён', description: `Заказ #${confirmDelete.orderID} удалён.` });
            setConfirmDelete(null);
        } catch (err: any) {
            setToast({
                open: true,
                type: 'error',
                title: 'Не удалось удалить',
                description: err.response?.data?.message || 'Попробуйте ещё раз.'
            });
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-5xl mx-auto px-6 py-20">
                <div className="poster-border bg-[var(--paper-soft)] p-10">
                    <div className="w-12 h-12 border-4 border-[var(--line)] border-t-[var(--coral)] rounded-full animate-spin" />
                    <p className="text-[var(--muted)] mt-4">Загружаем твои заказы...</p>
                </div>
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div className="max-w-2xl mx-auto px-6 py-20 text-center">
                <div className="text-8xl mb-8 opacity-30">📦</div>
                <h1 className="display-font text-5xl mb-4 leading-none">У тебя пока нет заказов</h1>
                <p className="text-xl text-[var(--muted)] mb-10">Самое время сделать первый заказ!</p>
                <button
                    onClick={() => window.location.href = '/'}
                    className="px-10 py-4 border-2 border-[var(--line)] bg-[var(--coral)] text-white rounded-2xl font-semibold text-lg transition-all"
                >
                    Перейти в каталог
                </button>
                <Toast {...toast} onClose={() => setToast(t => ({ ...t, open: false }))} />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-6 py-16">
            <div className="flex items-center justify-between mb-12">
                <div>
                    <h1 className="display-font text-6xl leading-none">Мои заказы</h1>
                    <p className="text-xl text-[var(--muted)] mt-2">Всего заказов: {orders.length}</p>
                </div>
            </div>

            <div className="space-y-8">
                {orders.map((order) => (
                    <div
                        key={order.orderID}
                        className="bg-[var(--paper-soft)] rounded-3xl p-10 border-2 border-[var(--line)] shadow-[0_8px_0_rgba(21,17,15,0.12)]"
                    >
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-[var(--sun)]/30 border-2 border-[var(--line)] rounded-2xl flex items-center justify-center">
                                    <Package className="w-7 h-7 text-[var(--coral)]" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3">
                                        <Calendar className="w-5 h-5 text-[var(--coral)]" />
                                        <span className="text-xl font-semibold text-[var(--ink)]">
                                            {new Date(order.orderDate).toLocaleDateString('ru-RU', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric'
                                            })}
                                        </span>
                                    </div>
                                    <div className="text-sm text-[var(--muted)] mt-1">Заказ #{order.orderID}</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className={`px-5 py-2 rounded-2xl text-sm font-semibold ${
                                    order.status === 'Completed' ? 'bg-[var(--sun)]/25 text-[var(--muted)] border-2 border-[var(--line)]' :
                                        order.status === 'Cancelled' ? 'bg-red-50 text-red-700 border border-red-200' :
                                            'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}>
                                    {order.status === 'Pending' ? 'В обработке' :
                                        order.status === 'Completed' ? 'Выполнен' : 'Отменён'}
                                </div>

                                <div className="text-right">
                                    <div className="text-4xl font-bold tabular-nums text-[var(--ink)]">{order.totalAmount}</div>
                                    <div className="text-xs text-[var(--muted)] -mt-1">РУБ</div>
                                </div>

                                {canManage(order) && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => openEdit(order)}
                                            className="p-3 bg-[var(--sun)]/20 border-2 border-[var(--line)] hover:bg-[var(--sun)]/35 rounded-2xl transition-colors"
                                            title="Редактировать"
                                        >
                                            <Pencil className="w-5 h-5 text-[var(--ink)]" />
                                        </button>
                                        <button
                                            onClick={() => setConfirmDelete(order)}
                                            className="p-3 bg-red-50 border border-red-200 hover:bg-red-100 rounded-2xl transition-colors"
                                            title="Удалить"
                                        >
                                            <Trash2 className="w-5 h-5 text-red-700" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="border-t-2 border-[var(--line)] pt-8">
                            <div className="text-sm text-[var(--coral)] mb-4 tracking-widest font-semibold">СОСТАВ ЗАКАЗА</div>
                            <div className="space-y-4">
                                {order.items.map((item, i) => (
                                    <div key={i} className="flex justify-between items-center text-lg">
                                        <div className="flex items-center gap-4">
                                            <span className="font-semibold text-[var(--ink)]">{item.album.title}</span>
                                            <span className="text-[var(--muted)]">× {item.quantity}</span>
                                        </div>
                                        <div className="font-semibold text-[var(--ink)]">
                                            {(item.priceAtPurchase * item.quantity).toLocaleString('ru-RU')} ₽
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {editing && (
                <div className="fixed inset-0 z-[200] bg-black/30 backdrop-blur-sm flex items-center justify-center p-6">
                    <div className="w-full max-w-2xl bg-[var(--paper-soft)] border-2 border-[var(--line)] rounded-3xl p-8 shadow-xl">
                        <div className="flex items-start justify-between gap-6">
                            <div>
                                <div className="text-3xl font-bold text-[var(--ink)]">Редактировать заказ #{editing.orderID}</div>
                                <div className="text-sm text-[var(--muted)] mt-1">Можно менять только “В обработке”.</div>
                            </div>
                            <button
                                onClick={() => setEditing(null)}
                                className="p-3 rounded-2xl bg-[var(--sun)]/20 border-2 border-[var(--line)] hover:bg-[var(--sun)]/35 transition-colors"
                                title="Закрыть"
                            >
                                <X className="w-5 h-5 text-[var(--ink)]" />
                            </button>
                        </div>

                        <div className="mt-6 grid md:grid-cols-2 gap-4">
                            <input
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                placeholder="Имя"
                                className="w-full bg-white/70 border-2 border-[var(--line)] rounded-2xl px-5 py-4 outline-none focus:bg-[var(--sun)]/20"
                            />
                            <input
                                value={form.phone}
                                onChange={e => setForm({ ...form, phone: e.target.value })}
                                placeholder="Телефон"
                                className="w-full bg-white/70 border-2 border-[var(--line)] rounded-2xl px-5 py-4 outline-none focus:bg-[var(--sun)]/20"
                            />
                            <input
                                value={form.address}
                                onChange={e => setForm({ ...form, address: e.target.value })}
                                placeholder="Адрес"
                                className="md:col-span-2 w-full bg-white/70 border-2 border-[var(--line)] rounded-2xl px-5 py-4 outline-none focus:bg-[var(--sun)]/20"
                            />
                            <select
                                value={form.paymentMethod}
                                onChange={e => setForm({ ...form, paymentMethod: e.target.value })}
                                className="w-full bg-white/70 border-2 border-[var(--line)] rounded-2xl px-5 py-4 outline-none focus:bg-[var(--sun)]/20"
                            >
                                <option value="card">Карта</option>
                                <option value="cash">Наличные</option>
                                <option value="sbp">СБП</option>
                            </select>
                            <label className="flex items-center gap-3 text-[var(--ink)] font-semibold">
                                <input
                                    type="checkbox"
                                    checked={form.isGift}
                                    onChange={e => setForm({ ...form, isGift: e.target.checked })}
                                    className="w-5 h-5"
                                />
                                Подарок
                            </label>

                            {form.isGift && (
                                <>
                                    <input
                                        value={form.giftRecipientName}
                                        onChange={e => setForm({ ...form, giftRecipientName: e.target.value })}
                                        placeholder="Имя получателя"
                                        className="w-full bg-white/70 border-2 border-[var(--line)] rounded-2xl px-5 py-4 outline-none focus:bg-[var(--sun)]/20"
                                    />
                                    <input
                                        value={form.giftRecipientEmail}
                                        onChange={e => setForm({ ...form, giftRecipientEmail: e.target.value })}
                                        placeholder="Email получателя"
                                        className="w-full bg-white/70 border-2 border-[var(--line)] rounded-2xl px-5 py-4 outline-none focus:bg-[var(--sun)]/20"
                                    />
                                    <input
                                        value={form.giftFromName}
                                        onChange={e => setForm({ ...form, giftFromName: e.target.value })}
                                        placeholder="От кого"
                                        className="w-full bg-white/70 border-2 border-[var(--line)] rounded-2xl px-5 py-4 outline-none focus:bg-[var(--sun)]/20"
                                    />
                                    <textarea
                                        value={form.giftMessage}
                                        onChange={e => setForm({ ...form, giftMessage: e.target.value })}
                                        placeholder="Сообщение"
                                        rows={3}
                                        className="md:col-span-2 w-full bg-white/70 border-2 border-[var(--line)] rounded-2xl px-5 py-4 outline-none focus:bg-[var(--sun)]/20 resize-y"
                                    />
                                </>
                            )}
                        </div>

                        <div className="mt-8 flex gap-3">
                            <button
                                onClick={() => setEditing(null)}
                                className="flex-1 py-4 rounded-2xl border-2 border-[var(--line)] bg-[var(--sun)]/25 hover:bg-[var(--sun)]/35 transition-colors font-semibold text-[var(--ink)]"
                                disabled={saving}
                            >
                                Отмена
                            </button>
                            <button
                                onClick={saveEdit}
                                className="flex-1 py-4 rounded-2xl border-2 border-[var(--line)] bg-[var(--coral)] text-white font-semibold transition-colors disabled:opacity-60"
                                disabled={saving}
                            >
                                {saving ? 'Сохраняем...' : 'Сохранить'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmDialog
                open={Boolean(confirmDelete)}
                title={confirmDelete ? `Удалить заказ #${confirmDelete.orderID}?` : 'Удалить заказ?'}
                description="Заказ будет удалён, а количество товаров вернётся на склад. Это действие можно делать только для заказов “В обработке”."
                confirmText="Удалить"
                cancelText="Отмена"
                variant="danger"
                loading={deleting}
                onCancel={() => setConfirmDelete(null)}
                onConfirm={deleteOrder}
            />

            <Toast {...toast} onClose={() => setToast(t => ({ ...t, open: false }))} />
        </div>
    );
}