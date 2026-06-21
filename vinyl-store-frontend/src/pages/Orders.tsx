import { useEffect, useMemo, useState } from 'react';
import api from '../api/api';
import type { Order } from '../types';
import { Calendar, Package, Pencil, Trash2, X } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import Toast, { type ToastState } from '../components/Toast';

// Функция для красивого перевода статусов на русский язык
const getStatusText = (status: string) => {
    switch(status) {
        case 'Pending': return 'В обработке';
        case 'Processing': return 'В сборке';
        case 'Shipped': return 'В пути';
        case 'Completed': return 'Выполнен';
        case 'Cancelled': return 'Отменён';
        default: return status;
    }
};

// Функция для подбора правильных цветов под каждый статус заказа
const getStatusStyle = (status: string) => {
    switch(status) {
        case 'Pending': return 'bg-amber-50 text-amber-700 border border-amber-200';
        case 'Processing': return 'bg-blue-50 text-blue-700 border border-blue-200';
        case 'Shipped': return 'bg-purple-50 text-purple-700 border border-purple-200';
        case 'Completed': return 'bg-green-50 text-green-700 border border-green-200';
        case 'Cancelled': return 'bg-red-50 text-red-700 border border-red-200';
        default: return 'bg-gray-50 text-gray-700 border border-gray-200';
    }
};

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
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-20 flex justify-center items-center">
                <div className="poster-border bg-[var(--paper-soft)] p-8 sm:p-10 text-center w-full max-w-md">
                    <div className="w-12 h-12 border-4 border-[var(--line)] border-t-[var(--coral)] rounded-full animate-spin mx-auto" />
                    <p className="text-[var(--muted)] font-bold mt-5">Загружаем твои заказы...</p>
                </div>
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div className="max-w-2xl mx-auto px-4 sm:px-6 py-20 text-center">
                <div className="text-7xl sm:text-8xl mb-6 opacity-30">📦</div>
                <h1 className="display-font text-4xl sm:text-5xl mb-4 leading-none">У тебя пока нет заказов</h1>
                <p className="text-lg sm:text-xl text-[var(--muted)] mb-8">Самое время сделать первый заказ!</p>
                <button
                    onClick={() => window.location.href = '/'}
                    className="w-full sm:w-auto px-10 py-4 border-2 border-[var(--line)] bg-[var(--coral)] text-white rounded-2xl font-black uppercase tracking-wider text-base sm:text-lg transition-transform active:scale-95"
                >
                    Перейти в каталог
                </button>
                <Toast {...toast} onClose={() => setToast(t => ({ ...t, open: false }))} />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
            <div className="flex items-center justify-between mb-8 sm:mb-12">
                <div>
                    <h1 className="display-font text-4xl sm:text-6xl leading-none">Мои заказы</h1>
                    <p className="text-base sm:text-xl text-[var(--muted)] mt-2 font-semibold">Всего заказов: {orders.length}</p>
                </div>
            </div>

            <div className="space-y-6 sm:space-y-8">
                {orders.map((order) => (
                    <div
                        key={order.orderID}
                        className="bg-[var(--paper-soft)] rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 lg:p-10 border-2 border-[var(--line)] shadow-[0_6px_0_rgba(21,17,15,0.12)] sm:shadow-[0_8px_0_rgba(21,17,15,0.12)]"
                    >
                        {/* Верхняя панель карточки */}
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6 mb-6 sm:mb-8">
                            <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[var(--sun)]/30 border-2 border-[var(--line)] rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0">
                                    <Package className="w-6 h-6 sm:w-7 sm:h-7 text-[var(--coral)]" />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--coral)] shrink-0" />
                                        <span className="text-lg sm:text-xl font-bold text-[var(--ink)]">
                                            {new Date(order.orderDate).toLocaleDateString('ru-RU', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric'
                                            })}
                                        </span>
                                    </div>
                                    <div className="text-xs sm:text-sm font-bold text-[var(--muted)] mt-1">Заказ #{order.orderID}</div>
                                </div>
                            </div>

                            {/* Блок статуса, цены и кнопок действий */}
                            <div className="flex flex-wrap sm:flex-nowrap items-center justify-between lg:justify-end gap-4 w-full lg:w-auto border-t lg:border-t-0 border-dashed border-[var(--line)] pt-4 lg:pt-0">
                                <div className="flex items-center gap-3 sm:gap-4">
                                    <div className={`px-4 py-1.5 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider shrink-0 ${getStatusStyle(order.status)}`}>
                                        {getStatusText(order.status)}
                                    </div>

                                    <div className="text-left sm:text-right">
                                        <div className="text-2xl sm:text-3xl lg:text-4xl font-black tabular-nums text-[var(--ink)] leading-none">{order.totalAmount.toLocaleString('ru-RU')}</div>
                                        <div className="text-[10px] sm:text-xs font-black text-[var(--muted)] mt-0.5">РУБ</div>
                                    </div>
                                </div>

                                {canManage(order) && (
                                    <div className="flex gap-2 ml-auto sm:ml-0">
                                        <button
                                            onClick={() => openEdit(order)}
                                            className="p-2.5 sm:p-3 bg-[var(--sun)]/20 border-2 border-[var(--line)] hover:bg-[var(--sun)]/35 rounded-xl sm:rounded-2xl transition-colors"
                                            title="Редактировать доставку"
                                        >
                                            <Pencil className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--ink)]" />
                                        </button>
                                        <button
                                            onClick={() => setConfirmDelete(order)}
                                            className="p-2.5 sm:p-3 bg-red-50 border-2 border-red-200 hover:bg-red-100 rounded-xl sm:rounded-2xl transition-colors"
                                            title="Удалить / Отменить"
                                        >
                                            <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-red-700" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Состав заказа */}
                        <div className="border-t-2 border-[var(--line)] pt-5 sm:pt-8">
                            <div className="text-xs text-[var(--coral)] mb-4 tracking-widest font-black uppercase">СОСТАВ ЗАКАЗА</div>
                            <div className="space-y-3 sm:space-y-4">
                                {order.items.map((item, i) => (
                                    <div key={i} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-4 text-base sm:text-lg border-b border-dashed border-[var(--line)]/40 pb-2 last:border-b-0 last:pb-0">
                                        <div className="flex items-start gap-2 min-w-0">
                                            <span className="font-bold text-[var(--ink)] break-words pr-1">{item.album.title}</span>
                                            <span className="text-sm font-black text-[var(--muted)] whitespace-nowrap shrink-0 mt-0.5">× {item.quantity}</span>
                                        </div>
                                        <div className="font-black text-[var(--ink)] tabular-nums sm:text-right shrink-0">
                                            {(item.priceAtPurchase * item.quantity).toLocaleString('ru-RU')} ₽
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ОПТИМИЗИРОВАННОЕ МОДАЛЬНОЕ ОКНО РЕДАКТИРОВАНИЯ */}
            {editing && (
                <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
                    <div className="w-full max-w-2xl bg-[var(--paper-soft)] border-2 border-[var(--line)] rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-xl max-h-[95vh] flex flex-col overflow-hidden">
                        <div className="flex items-start justify-between gap-4 pb-4 border-b border-dashed border-[var(--line)]">
                            <div>
                                <div className="text-xl sm:text-3xl font-black text-[var(--ink)] leading-tight">Редактировать заказ #{editing.orderID}</div>
                                <div className="text-xs sm:text-sm font-semibold text-[var(--muted)] mt-1">Изменение данных доставки (статус: В обработке).</div>
                            </div>
                            <button
                                onClick={() => setEditing(null)}
                                className="p-2.5 rounded-xl bg-[var(--sun)]/20 border-2 border-[var(--line)] hover:bg-[var(--sun)]/35 transition-colors shrink-0"
                                title="Закрыть"
                            >
                                <X className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--ink)]" />
                            </button>
                        </div>

                        {/* Форма со скроллом на мобильных */}
                        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto pr-1 flex-grow">
                            <label className="block">
                                <span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-[var(--muted)]">Имя получателя</span>
                                <input
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    placeholder="Имя Фамилия"
                                    className="w-full bg-white border-2 border-[var(--line)] rounded-xl px-4 py-3.5 font-bold outline-none focus:bg-[var(--sun)]/20"
                                />
                            </label>
                            <label className="block">
                                <span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-[var(--muted)]">Телефон</span>
                                <input
                                    value={form.phone}
                                    onChange={e => setForm({ ...form, phone: e.target.value })}
                                    placeholder="Контактный телефон"
                                    className="w-full bg-white border-2 border-[var(--line)] rounded-xl px-4 py-3.5 font-bold outline-none focus:bg-[var(--sun)]/20"
                                />
                            </label>
                            <label className="block md:col-span-2">
                                <span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-[var(--muted)]">Адрес доставки</span>
                                <input
                                    value={form.address}
                                    onChange={e => setForm({ ...form, address: e.target.value })}
                                    placeholder="Город, улица, дом, квартира"
                                    className="w-full bg-white border-2 border-[var(--line)] rounded-xl px-4 py-3.5 font-bold outline-none focus:bg-[var(--sun)]/20"
                                />
                            </label>
                            <label className="block">
                                <span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-[var(--muted)]">Способ оплаты</span>
                                <select
                                    value={form.paymentMethod}
                                    onChange={e => setForm({ ...form, paymentMethod: e.target.value })}
                                    className="w-full bg-white border-2 border-[var(--line)] rounded-xl px-4 py-3.5 font-bold outline-none focus:bg-[var(--sun)]/20 cursor-pointer"
                                >
                                    <option value="card">Карта</option>
                                    <option value="cash">Наличные</option>
                                    <option value="sbp">СБП</option>
                                </select>
                            </label>

                            <div className="flex items-center pt-5 md:pt-6">
                                <label className="flex items-center gap-3 text-[var(--ink)] font-black uppercase text-xs sm:text-sm tracking-wider cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={form.isGift}
                                        onChange={e => setForm({ ...form, isGift: e.target.checked })}
                                        className="w-5 h-5 accent-[var(--coral)]"
                                    />
                                    Заказ в подарок
                                </label>
                            </div>

                            {form.isGift && (
                                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-dashed border-[var(--line)] pt-4 mt-2">
                                    <label className="block">
                                        <span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-[var(--muted)]">Имя получателя подарка</span>
                                        <input
                                            value={form.giftRecipientName}
                                            onChange={e => setForm({ ...form, giftRecipientName: e.target.value })}
                                            placeholder="Кому подарок"
                                            className="w-full bg-white border-2 border-[var(--line)] rounded-xl px-4 py-3.5 font-bold outline-none focus:bg-[var(--sun)]/20"
                                        />
                                    </label>
                                    <label className="block">
                                        <span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-[var(--muted)]">Email получателя</span>
                                        <input
                                            value={form.giftRecipientEmail}
                                            onChange={e => setForm({ ...form, giftRecipientEmail: e.target.value })}
                                            placeholder="name@example.com"
                                            className="w-full bg-white border-2 border-[var(--line)] rounded-xl px-4 py-3.5 font-bold outline-none focus:bg-[var(--sun)]/20"
                                        />
                                    </label>
                                    <label className="block md:col-span-2">
                                        <span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-[var(--muted)]">От кого</span>
                                        <input
                                            value={form.giftFromName}
                                            onChange={e => setForm({ ...form, giftFromName: e.target.value })}
                                            placeholder="Имя отправителя"
                                            className="w-full bg-white border-2 border-[var(--line)] rounded-xl px-4 py-3.5 font-bold outline-none focus:bg-[var(--sun)]/20"
                                        />
                                    </label>
                                    <label className="block md:col-span-2">
                                        <span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-[var(--muted)]">Поздравительное сообщение</span>
                                        <textarea
                                            value={form.giftMessage}
                                            onChange={e => setForm({ ...form, giftMessage: e.target.value })}
                                            placeholder="Текст открытки к пластинке..."
                                            rows={3}
                                            className="w-full bg-white border-2 border-[var(--line)] rounded-xl px-4 py-3.5 font-bold outline-none focus:bg-[var(--sun)]/20 resize-y"
                                        />
                                    </label>
                                </div>
                            )}
                        </div>

                        {/* Кнопки модалки */}
                        <div className="mt-6 flex flex-col sm:flex-row gap-3 pt-4 border-t border-dashed border-[var(--line)]">
                            <button
                                onClick={() => setEditing(null)}
                                className="w-full sm:flex-1 py-4 rounded-xl border-2 border-[var(--line)] bg-[var(--sun)]/25 hover:bg-[var(--sun)]/35 transition-colors font-black uppercase tracking-wider text-xs sm:text-sm text-[var(--ink)]"
                                disabled={saving}
                            >
                                Отмена
                            </button>
                            <button
                                onClick={saveEdit}
                                className="w-full sm:flex-1 py-4 rounded-xl border-2 border-[var(--line)] bg-[var(--coral)] text-white font-black uppercase tracking-wider text-xs sm:text-sm transition-colors disabled:opacity-60 hover:bg-[#d84a2f]"
                                disabled={saving}
                            >
                                {saving ? 'Сохраняем...' : 'Сохранить изменения'}
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