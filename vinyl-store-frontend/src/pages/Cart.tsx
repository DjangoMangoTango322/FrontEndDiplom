import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag } from 'lucide-react';

const formatPrice = (value: number) => value.toLocaleString('ru-RU');

export default function Cart() {
    const { cart, removeFromCart, updateQuantity, getTotal } = useCart();
    const navigate = useNavigate();

    if (cart.length === 0) {
        return (
            <main className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center px-5 py-16 text-center">
                <div className="poster-border bg-[var(--paper-soft)] p-8 md:p-12">
                    <ShoppingBag className="mx-auto h-16 w-16 text-[var(--coral)]" />
                    <h1 className="display-font mt-6 text-6xl leading-none md:text-8xl">Корзина пуста</h1>
                    <p className="mx-auto mt-5 max-w-md text-xl text-[var(--muted)]">Самое время пополнить коллекцию новой пластинкой.</p>
                    <button
                        onClick={() => navigate('/')}
                        className="mt-8 inline-flex items-center gap-3 border-2 border-[var(--line)] bg-[var(--coral)] px-8 py-4 font-black uppercase tracking-[0.14em] text-white poster-border-sm"
                    >
                        В каталог <ArrowRight className="h-5 w-5" />
                    </button>
                </div>
            </main>
        );
    }

    return (
        <main className="mx-auto max-w-7xl px-5 py-12 md:px-8">
            <div className="mb-10 flex flex-col justify-between gap-6 border-b-2 border-[var(--line)] pb-8 md:flex-row md:items-end">
                <div>
                    <div className="text-xs font-black uppercase tracking-[0.22em] text-[var(--coral)]">Cart summary</div>
                    <h1 className="display-font mt-2 text-7xl leading-none md:text-9xl">Корзина</h1>
                </div>
                <div className="poster-border-sm bg-[var(--sun)] px-6 py-4 text-right">
                    <div className="display-font text-5xl leading-none">{formatPrice(getTotal())}</div>
                    <div className="text-xs font-black uppercase tracking-[0.2em]">Итого ₽</div>
                </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-12">
                <div className="space-y-5 lg:col-span-8">
                    {cart.map(item => (
                        <article key={item.albumID} className="grid gap-5 bg-[var(--paper-soft)] p-4 poster-border-sm sm:grid-cols-[150px_1fr] md:p-5">
                            <img
                                src={item.imageURL || `https://picsum.photos/seed/${item.albumID}/500/500`}
                                className="aspect-square w-full border-2 border-[var(--line)] object-cover sm:w-[150px]"
                                alt={item.title}
                            />

                            <div className="flex min-w-0 flex-col">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h2 className="display-font line-clamp-2 text-3xl leading-none">{item.title}</h2>
                                        <div className="mt-2 text-lg font-bold text-[var(--blue)]">{item.artist?.name}</div>
                                    </div>
                                    <button
                                        onClick={() => removeFromCart(item.albumID)}
                                        className="grid h-11 w-11 flex-none place-items-center border-2 border-[var(--line)] bg-red-100 text-red-700 hover:bg-red-200"
                                        title="Удалить"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                </div>

                                <div className="mt-6 flex flex-col gap-4 border-t-2 border-[var(--line)] pt-5 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => updateQuantity(item.albumID, item.quantity - 1)}
                                            className="grid h-11 w-11 place-items-center border-2 border-[var(--line)] bg-white hover:bg-[var(--sun)]"
                                            title="Уменьшить"
                                        >
                                            <Minus className="h-4 w-4" />
                                        </button>
                                        <div className="display-font w-12 text-center text-4xl">{item.quantity}</div>
                                        <button
                                            onClick={() => updateQuantity(item.albumID, item.quantity + 1)}
                                            className="grid h-11 w-11 place-items-center border-2 border-[var(--line)] bg-white hover:bg-[var(--sun)]"
                                            title="Увеличить"
                                        >
                                            <Plus className="h-4 w-4" />
                                        </button>
                                    </div>

                                    <div className="text-right">
                                        <div className="display-font text-4xl leading-none">{formatPrice(item.price * item.quantity)} ₽</div>
                                        <div className="text-xs font-black uppercase tracking-[0.16em] text-[var(--muted)]">{formatPrice(item.price)} ₽ за шт.</div>
                                    </div>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>

                <aside className="lg:col-span-4">
                    <div className="sticky top-28 bg-[var(--ink)] p-7 text-white poster-border">
                        <div className="text-xs font-black uppercase tracking-[0.22em] text-[var(--sun)]">К оплате</div>
                        <div className="mt-4 display-font text-7xl leading-none">{formatPrice(getTotal())}</div>
                        <div className="text-sm font-black uppercase tracking-[0.2em] text-white/60">рублей</div>

                        <button
                            onClick={() => navigate('/checkout')}
                            className="mt-8 flex w-full items-center justify-center gap-3 border-2 border-white bg-[var(--coral)] px-6 py-5 font-black uppercase tracking-[0.13em] text-white"
                        >
                            Оформить заказ <ArrowRight className="h-5 w-5" />
                        </button>

                        <div className="mt-6 border-t-2 border-white/20 pt-5 text-sm text-white/70">
                            Доставка по Москве 1-2 дня. Бесплатно при заказе от 15 000 ₽.
                        </div>
                    </div>
                </aside>
            </div>
        </main>
    );
}
