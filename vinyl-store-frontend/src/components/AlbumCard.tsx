import { useState } from 'react';
import type { Album } from '../types';
import { useCart } from '../context/CartContext';
import { Info, Plus, ShoppingBag, X } from 'lucide-react';

interface Props {
    album: Album;
}

const formatPrice = (value: number) => value.toLocaleString('ru-RU');

const makeCover = (title: string, artist: string, seed: number) => {
    const palettes = [
        ['#f05a3b', '#f4c84b', '#15110f'],
        ['#2e5f8f', '#9ed8c3', '#15110f'],
        ['#15110f', '#f4eadf', '#f05a3b'],
        ['#9ed8c3', '#f4c84b', '#2e5f8f'],
    ];
    const [bg, accent, ink] = palettes[seed % palettes.length];
    const safeTitle = title.replace(/[<&>"]/g, '');
    const safeArtist = artist.replace(/[<&>"]/g, '');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 900"><rect width="900" height="900" fill="${bg}"/><circle cx="450" cy="450" r="300" fill="${accent}" stroke="${ink}" stroke-width="22"/><circle cx="450" cy="450" r="88" fill="${bg}" stroke="${ink}" stroke-width="18"/><path d="M90 122H810M90 778H810" stroke="${ink}" stroke-width="18"/><text x="90" y="220" font-family="Arial Black, Arial" font-size="72" font-weight="900" fill="${ink}">${safeTitle.slice(0, 16)}</text><text x="90" y="720" font-family="Arial, sans-serif" font-size="34" font-weight="700" letter-spacing="8" fill="${ink}">${safeArtist.slice(0, 22).toUpperCase()}</text></svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

export default function AlbumCard({ album }: Props) {
    const { addToCart } = useCart();
    const [showModal, setShowModal] = useState(false);
    const fallbackCover = makeCover(album.title, album.artist?.name || 'Vinyl Store', album.albumID);

    const handleAddToCart = (e: React.MouseEvent) => {
        e.stopPropagation();
        addToCart(album);
    };

    return (
        <>
            <article
                onClick={() => setShowModal(true)}
                className="group flex h-full cursor-pointer flex-col overflow-hidden bg-[var(--paper-soft)] poster-border-sm transition-transform duration-300 hover:-translate-y-1"
            >
                <div className="relative aspect-square overflow-hidden border-b-2 border-[var(--line)] bg-[var(--sun)]">
                    <img
                        src={album.imageURL || `https://picsum.photos/seed/vinyl-${album.albumID}/700/700`}
                        alt={album.title}
                        onError={e => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = fallbackCover;
                        }}
                        className="h-full w-full object-cover grayscale-[18%] transition duration-700 group-hover:scale-105 group-hover:grayscale-0"
                    />
                    <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-4 text-white">
                        <span className="border-2 border-white bg-[var(--coral)] px-3 py-1 text-xs font-black uppercase tracking-[0.16em]">
                            {album.genre?.name || 'Vinyl'}
                        </span>
                        <button
                            onClick={handleAddToCart}
                            disabled={album.stockQuantity === 0}
                            className="grid h-11 w-11 place-items-center rounded-full border-2 border-white bg-white text-[var(--ink)] transition-transform hover:scale-105 disabled:opacity-40"
                            title="Добавить в корзину"
                        >
                            <Plus className="h-5 w-5" />
                        </button>
                    </div>
                    {album.stockQuantity === 0 && (
                        <div className="absolute right-3 top-3 rotate-3 border-2 border-[var(--line)] bg-white px-3 py-1 text-xs font-black uppercase">
                            Нет в наличии
                        </div>
                    )}
                </div>

                <div className="flex flex-1 flex-col p-5">
                    <div className="text-xs font-black uppercase tracking-[0.18em] text-[var(--blue)]">
                        {album.artist?.name || 'Unknown artist'}
                    </div>
                    <h3 className="display-font mt-2 line-clamp-2 text-2xl leading-[0.96]">
                        {album.title}
                    </h3>
                    <div className="mt-4 flex items-center justify-between gap-3 border-t-2 border-[var(--line)] pt-4">
                        <div>
                            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--muted)]">Цена</div>
                            <div className="text-2xl font-black tabular-nums">{formatPrice(album.price)} ₽</div>
                        </div>
                        <div className="text-right text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
                            {album.releaseYear || 'Reissue'}<br />
                            {album.stockQuantity} шт.
                        </div>
                    </div>
                </div>
            </article>

            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4" onClick={() => setShowModal(false)}>
                    <div
                        className="max-h-[92vh] w-full max-w-5xl overflow-auto bg-[var(--paper-soft)] poster-border"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="grid lg:grid-cols-2">
                            <div className="relative min-h-[320px] border-b-2 border-[var(--line)] bg-[var(--sun)] lg:border-b-0 lg:border-r-2">
                                <img
                                    src={album.imageURL || `https://picsum.photos/seed/vinyl-${album.albumID}/900/900`}
                                    alt={album.title}
                                    onError={e => {
                                        e.currentTarget.onerror = null;
                                        e.currentTarget.src = fallbackCover;
                                    }}
                                    className="h-full min-h-[320px] w-full object-cover"
                                />
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="absolute right-4 top-4 grid h-12 w-12 place-items-center border-2 border-[var(--line)] bg-[var(--paper-soft)]"
                                    title="Закрыть"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="flex flex-col p-7 md:p-10">
                                <div className="flex flex-wrap gap-2">
                                    <span className="border-2 border-[var(--line)] bg-[var(--mint)] px-3 py-1 text-xs font-black uppercase tracking-[0.16em]">
                                        {album.genre?.name || 'Vinyl'}
                                    </span>
                                    <span className="border-2 border-[var(--line)] bg-[var(--sun)] px-3 py-1 text-xs font-black uppercase tracking-[0.16em]">
                                        {album.releaseYear || 'Archive'}
                                    </span>
                                </div>

                                <h2 className="display-font mt-6 text-5xl leading-[0.92] md:text-7xl">{album.title}</h2>
                                <p className="mt-4 text-2xl font-bold text-[var(--blue)]">{album.artist?.name}</p>

                                <p className="mt-8 max-w-prose text-lg leading-8 text-[var(--muted)]">
                                    {album.description || 'Виниловая пластинка для внимательного прослушивания: плотный звук, физический формат и обложка, которую хочется держать в руках.'}
                                </p>

                                <div className="mt-8 flex items-start gap-3 border-y-2 border-[var(--line)] py-5">
                                    <Info className="mt-1 h-5 w-5 text-[var(--coral)]" />
                                    <div className="text-sm font-semibold text-[var(--muted)]">
                                        В наличии {album.stockQuantity} шт. Добавление в корзину ограничено остатком на складе.
                                    </div>
                                </div>

                                <div className="mt-auto flex flex-col gap-5 pt-8 sm:flex-row sm:items-end sm:justify-between">
                                    <div>
                                        <div className="text-xs font-black uppercase tracking-[0.2em] text-[var(--coral)]">Стоимость</div>
                                        <div className="display-font text-6xl leading-none">{formatPrice(album.price)} ₽</div>
                                    </div>
                                    <button
                                        onClick={handleAddToCart}
                                        disabled={album.stockQuantity === 0}
                                        className="inline-flex items-center justify-center gap-3 border-2 border-[var(--line)] bg-[var(--ink)] px-8 py-4 font-black uppercase tracking-[0.13em] text-white transition-transform hover:-translate-y-0.5 disabled:opacity-45"
                                    >
                                        <ShoppingBag className="h-5 w-5" /> В корзину
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
