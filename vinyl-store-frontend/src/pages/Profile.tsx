import { useEffect, useState } from 'react';
import api from '../api/api';

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

export default function Profile() {
    const [me, setMe] = useState<MeDto | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const run = async () => {
            try {
                const res = await api.get<MeDto>('/users/me');
                setMe(res.data);
            } finally {
                setLoading(false);
            }
        };
        run();
    }, []);

    if (loading) {
        return (
            <div className="max-w-5xl mx-auto px-6 py-20">
                <div className="poster-border bg-[var(--paper-soft)] p-10">
                    <div className="w-12 h-12 border-4 border-[var(--line)] border-t-[var(--coral)] rounded-full animate-spin" />
                    <div className="mt-4 text-[var(--muted)]">Загружаем профиль...</div>
                </div>
            </div>
        );
    }

    if (!me) {
        return (
            <div className="max-w-5xl mx-auto px-6 py-20">
                <div className="poster-border bg-[var(--paper-soft)] p-10">
                    <div className="text-2xl font-bold">Не удалось загрузить профиль</div>
                    <div className="text-[var(--muted)] mt-2">Попробуй обновить страницу или войти заново.</div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-6 py-16">
            <div className="poster-border bg-[var(--paper-soft)] p-10">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div>
                        <h1 className="display-font text-5xl leading-none">Профиль</h1>
                        <div className="mt-2 text-[var(--muted)]">{me.email}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-[var(--muted)]">Пользователь</div>
                        <div className="text-2xl font-semibold">{me.username}</div>
                        <div className="text-xs text-[var(--coral)] mt-1">{me.role}</div>
                    </div>
                </div>

                <div className="mt-10 border-t-2 border-[var(--line)] pt-8">
                    <div className="text-sm tracking-widest font-semibold text-[var(--coral)]">ПОСЛЕДНИЕ ЗАКАЗЫ</div>

                    {me.recentOrders.length === 0 ? (
                        <div className="mt-4 text-[var(--muted)]">Пока нет заказов.</div>
                    ) : (
                        <div className="mt-6 space-y-6">
                            {me.recentOrders.map(o => (
                                <div key={o.orderId} className="border-2 border-[var(--line)] bg-white/35 rounded-3xl p-8">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                        <div>
                                            <div className="text-2xl font-bold">Заказ #{o.orderId}</div>
                                            <div className="text-[var(--muted)] mt-1">
                                                {new Date(o.orderDate).toLocaleString('ru-RU')}
                                            </div>
                                            <div className="text-xs text-[var(--coral)] mt-2">Статус: {o.status}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm text-[var(--muted)]">Сумма</div>
                                            <div className="text-4xl font-bold tabular-nums">{o.totalAmount}</div>
                                            <div className="text-xs text-[var(--coral)] -mt-1">РУБ</div>
                                        </div>
                                    </div>

                                    <div className="mt-6 grid md:grid-cols-2 gap-6">
                                        <div className="bg-[var(--sun)]/20 border-2 border-[var(--line)] rounded-2xl p-5">
                                            <div className="text-xs tracking-widest font-semibold text-[var(--coral)]">ДОСТАВКА</div>
                                            <div className="mt-3 font-semibold">{o.customerName}</div>
                                            <div className="text-[var(--muted)]">{o.customerPhone}</div>
                                            <div className="text-[var(--muted)] mt-2">{o.deliveryAddress}</div>
                                            <div className="text-xs text-[var(--coral)] mt-3">Оплата: {o.paymentMethod}</div>
                                        </div>

                                        <div className="bg-[var(--sun)]/20 border-2 border-[var(--line)] rounded-2xl p-5">
                                            <div className="text-xs tracking-widest font-semibold text-[var(--coral)]">ПОДАРОК</div>
                                            {o.isGift ? (
                                                <div className="mt-3 space-y-1 text-[var(--ink)]">
                                                    <div><span className="font-semibold">Получатель:</span> {o.giftRecipientName || '-'}</div>
                                                    <div><span className="font-semibold">Email:</span> {o.giftRecipientEmail || '-'}</div>
                                                    <div><span className="font-semibold">От:</span> {o.giftFromName || '-'}</div>
                                                    <div className="pt-2 text-[var(--muted)] whitespace-pre-wrap">{o.giftMessage || ''}</div>
                                                </div>
                                            ) : (
                                                <div className="mt-3 text-[var(--muted)]">Нет</div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-6 border-t-2 border-[var(--line)] pt-6">
                                        <div className="text-xs tracking-widest font-semibold text-[var(--coral)]">СОСТАВ</div>
                                        <div className="mt-4 space-y-3">
                                            {o.items.map((it) => (
                                                <div key={`${o.orderId}-${it.albumId}`} className="flex items-center justify-between gap-4">
                                                    <div className="flex items-center gap-4 min-w-0">
                                                        {it.imageUrl ? (
                                                            <img src={it.imageUrl} alt={it.title} className="w-12 h-12 rounded-xl object-cover border-2 border-[var(--line)]" />
                                                        ) : (
                                                            <div className="w-12 h-12 rounded-xl bg-[var(--sun)]/30 border-2 border-[var(--line)]" />
                                                        )}
                                                        <div className="min-w-0">
                                                            <div className="font-semibold truncate">{it.title}</div>
                                                            <div className="text-sm text-[var(--muted)]">× {it.quantity}</div>
                                                        </div>
                                                    </div>
                                                    <div className="font-semibold tabular-nums">
                                                        {(it.priceAtPurchase * it.quantity).toLocaleString('ru-RU')} ₽
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

