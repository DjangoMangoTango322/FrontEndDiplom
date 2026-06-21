import { useEffect, useState } from 'react';
import api from '../api/api';

// 1. Возвращаем локальные типы данных, которые были в твоем исходном файле
type MeOrderItem = {
    albumId: number;
    title: string;
    quantity: number;
    priceAtPurchase: number;
    imageUrl: string;
};

type MeOrder = {
    orderId: number;
    orderDate: string;
    totalAmount: number;
    status: string;
    customerName: string;
    customerPhone: string;
    deliveryAddress: string;
    paymentMethod: string;
    isGift: boolean;
    giftRecipientName?: string | null;
    giftRecipientEmail?: string | null;
    giftMessage?: string | null;
    giftFromName?: string | null;
    items: MeOrderItem[];
};

type MeDto = {
    userId: number;
    username: string;
    email: string;
    role: string;
    createdAt: string;
    recentOrders: MeOrder[];
};

const formatPrice = (value: number) => value.toLocaleString('ru-RU');

// 2. Функция для перевода статусов на русский язык в профиле
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

// 3. Функция для цветовой стилизации статусов в профиле
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

export default function Profile() {
    const [me, setMe] = useState<MeDto | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const run = async () => {
            try {
                const res = await api.get<MeDto>('/users/me');
                setMe(res.data);
            } catch (err) {
                // ИСПРАВЛЕНО: console с маленькой буквы
                console.error('Не удалось загрузить данные профиля:', err);
            } finally {
                // ИСПРАВЛЕНО: setLoading с маленькой буквы
                setLoading(false);
            }
        };
        // ИСПРАВЛЕНО: run с маленькой буквы
        run();
    }, []);

    if (loading) {
        return (
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-20 flex justify-center items-center">
                <div className="poster-border bg-[var(--paper-soft)] p-8 sm:p-10 text-center w-full max-w-md">
                    <div className="w-12 h-12 border-4 border-[var(--line)] border-t-[var(--coral)] rounded-full animate-spin mx-auto" />
                    <div className="mt-5 text-[var(--muted)] font-bold">Загружаем профиль...</div>
                </div>
            </div>
        );
    }

    if (!me) {
        return (
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-20">
                <div className="poster-border bg-[var(--paper-soft)] p-6 sm:p-10 text-center">
                    <div className="text-xl sm:text-2xl font-black text-red-700">Не удалось загрузить профиль</div>
                    <div className="text-[var(--muted)] font-semibold mt-2">Попробуй обновить страницу или войти заново.</div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
            <div className="poster-border bg-[var(--paper-soft)] p-4 sm:p-6 md:p-8 lg:p-10">

                {/* Шапка профиля */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-6">
                    <div>
                        <h1 className="display-font text-4xl sm:text-5xl leading-none">Профиль</h1>
                        <div className="mt-2 text-sm sm:text-base text-[var(--muted)] font-semibold break-all">{me.email}</div>
                    </div>
                    <div className="text-left md:text-right border-t md:border-t-0 border-dashed border-[var(--line)]/60 pt-4 md:pt-0">
                        <div className="text-xs sm:text-sm text-[var(--muted)] font-black uppercase tracking-wider">Пользователь</div>
                        <div className="text-xl sm:text-2xl font-black text-[var(--ink)] mt-0.5">{me.username}</div>
                        <div className="inline-block bg-[var(--coral)]/10 text-[var(--coral)] font-black uppercase text-[10px] sm:text-xs px-2.5 py-1 rounded-md mt-2 tracking-wider">
                            {me.role}
                        </div>
                    </div>
                </div>

                {/* Блок последних заказов */}
                <div className="mt-10 border-t-2 border-[var(--line)] pt-6 sm:pt-8">
                    <div className="text-xs sm:text-sm tracking-widest font-black text-[var(--coral)] uppercase">ПОСЛЕДНИЕ ЗАКАЗЫ</div>

                    {me.recentOrders.length === 0 ? (
                        <div className="mt-4 text-[var(--muted)] font-semibold">Пока нет оформленных заказов.</div>
                    ) : (
                        <div className="mt-6 space-y-6">

                            {me.recentOrders.map((o: MeOrder) => (
                                <div key={o.orderId} className="border-2 border-[var(--line)] bg-white/40 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8">

                                    {/* Шапка карточки заказа */}
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-dashed border-[var(--line)]/50 pb-5">
                                        <div>
                                            <div className="text-xl sm:text-2xl font-black text-[var(--ink)]">Заказ #{o.orderId}</div>
                                            <div className="text-xs sm:text-sm font-semibold text-[var(--muted)] mt-1">
                                                {new Date(o.orderDate).toLocaleString('ru-RU', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </div>
                                            <div className={`inline-block mt-3 px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wide ${getStatusStyle(o.status)}`}>
                                                {getStatusText(o.status)}
                                            </div>
                                        </div>
                                        <div className="text-left sm:text-right border-t sm:border-t-0 border-dashed border-[var(--line)]/40 pt-3 sm:pt-0">
                                            <div className="text-xs font-black text-[var(--muted)] uppercase tracking-wider">Сумма заказа</div>
                                            <div className="text-3xl sm:text-4xl font-black tabular-nums text-[var(--ink)] mt-1">{formatPrice(o.totalAmount)}</div>
                                            <div className="text-[10px] font-black text-[var(--coral)] uppercase">РУБ</div>
                                        </div>
                                    </div>

                                    {/* Детали доставки и подарка */}
                                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                        <div className="bg-[var(--sun)]/15 border-2 border-[var(--line)] rounded-xl sm:rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
                                            <div>
                                                <div className="text-[10px] sm:text-xs tracking-widest font-black text-[var(--coral)] uppercase">ДОСТАВКА</div>
                                                <div className="mt-3 font-black text-base sm:text-lg leading-tight">{o.customerName}</div>
                                                <div className="text-sm font-bold text-[var(--muted)] mt-1">{o.customerPhone}</div>
                                                <div className="text-sm font-semibold text-[var(--ink)] mt-3 bg-white/50 p-2.5 rounded-lg border border-[var(--line)]/30 break-words">{o.deliveryAddress}</div>
                                            </div>
                                            <div className="text-xs font-black text-[var(--coral)] uppercase tracking-wider mt-4 border-t border-dashed border-[var(--line)]/40 pt-2">
                                                Оплата: {o.paymentMethod === 'card' ? 'Карта онлайн' : 'Наличные/СБП'}
                                            </div>
                                        </div>

                                        <div className="bg-[var(--sun)]/15 border-2 border-[var(--line)] rounded-xl sm:rounded-2xl p-4 sm:p-5">
                                            <div className="text-[10px] sm:text-xs tracking-widest font-black text-[var(--coral)] uppercase">ПОДАРОК</div>
                                            {o.isGift ? (
                                                <div className="mt-3 space-y-1.5 text-xs sm:text-sm text-[var(--ink)] font-semibold">
                                                    <div><span className="text-[var(--muted)]">Получатель:</span> {o.giftRecipientName || '—'}</div>
                                                    <div className="break-all"><span className="text-[var(--muted)]">Email:</span> {o.giftRecipientEmail || '—'}</div>
                                                    <div><span className="text-[var(--muted)]">От кого:</span> {o.giftFromName || '—'}</div>
                                                    <div className="mt-3 p-3 bg-white/70 border-l-4 border-[var(--coral)] italic rounded-r-lg text-sm text-[var(--ink)] whitespace-pre-wrap">
                                                        "{o.giftMessage || 'Без сообщения'}"
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="mt-4 text-sm font-bold text-[var(--muted)] italic">Обычный заказ (не подарок)</div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Состав пластинок в заказе */}
                                    <div className="mt-6 border-t-2 border-[var(--line)] pt-5 sm:pt-6">
                                        <div className="text-[10px] sm:text-xs tracking-widest font-black text-[var(--coral)] uppercase mb-4">СОСТАВ ЗАКАЗА</div>
                                        <div className="space-y-3">
                                            {/* ИСПРАВЛЕНО: Явно типизируем параметр 'it' */}
                                            {o.items.map((it: MeOrderItem) => (
                                                <div key={`${o.orderId}-${it.albumId}`} className="flex items-center justify-between gap-3 border-b border-dashed border-[var(--line)]/30 pb-3 last:border-b-0 last:pb-0">
                                                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                                                        {it.imageUrl ? (
                                                            <img src={it.imageUrl} alt={it.title} className="w-12 h-12 rounded-xl object-cover border-2 border-[var(--line)] shrink-0" />
                                                        ) : (
                                                            <div className="w-12 h-12 rounded-xl bg-[var(--sun)]/30 border-2 border-[var(--line)] shrink-0" />
                                                        )}
                                                        <div className="min-w-0">
                                                            <div className="font-black text-sm sm:text-base text-[var(--ink)] truncate" title={it.title}>{it.title}</div>
                                                            <div className="text-xs sm:text-sm font-black text-[var(--muted)] mt-0.5">× {it.quantity} шт.</div>
                                                        </div>
                                                    </div>
                                                    <div className="font-black text-sm sm:text-base tabular-nums text-[var(--ink)] shrink-0">
                                                        {formatPrice(it.priceAtPurchase * it.quantity)} ₽
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}