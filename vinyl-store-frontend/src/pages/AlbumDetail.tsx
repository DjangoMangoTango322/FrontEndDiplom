import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import type { Album } from '../types';
import { useCart } from '../context/CartContext';
import api from '../api/api';
import { ArrowLeft, Plus, Disc3 } from 'lucide-react';

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

export default function AlbumDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const [album, setAlbum] = useState<Album | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAlbum = async () => {
            if (!id) return;
            try {
                setLoading(true);
                const res = await api.get(`/albums/${id}`);
                setAlbum(res.data);
            } catch (err) {
                setError('Не удалось загрузить информацию об альбоме');
            } finally {
                setLoading(false);
            }
        };
        fetchAlbum();
    }, [id]);

    if (loading) {
        return (
            <main className="mx-auto max-w-7xl px-5 py-20 text-center">
                <Disc3 className="mx-auto h-12 w-12 animate-spin text-[var(--coral)]" />
                <div className="mt-4 text-sm font-bold uppercase tracking-[0.22em]">Загрузка...</div>
            </main>
        );
    }

    if (error || !album) {
        return (
            <main className="mx-auto max-w-2xl px-5 py-20 text-center">
                <div className="bg-[var(--paper-soft)] p-8 poster-border">
                    <h1 className="display-font text-4xl leading-none text-[var(--coral)]">Ошибка</h1>
                    <p className="mt-4 text-lg text-[var(--muted)]">{error || 'Альбом не найден'}</p>
                    <button onClick={() => navigate(-1)} className="mt-8 border-2 border-[var(--line)] bg-[var(--ink)] px-8 py-4 font-black uppercase tracking-[0.14em] text-white">
                        Назад
                    </button>
                </div>
            </main>
        );
    }

    const fallbackCover = makeCover(album.title, album.artist?.name || 'Vinyl Store', album.albumID);

    return (
        <main className="mx-auto max-w-7xl px-5 py-12 md:px-8">
            <button onClick={() => navigate(-1)} className="mb-8 flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-[var(--muted)] hover:text-[var(--coral)]">
                <ArrowLeft className="h-4 w-4" /> Назад к каталогу
            </button>

            <div className="grid gap-10 lg:grid-cols-12">
                <div className="lg:col-span-5">
                    <div className="sticky top-24 aspect-square overflow-hidden border-2 border-[var(--line)] bg-[var(--sun)]">
                        <img
                            src={album.imageURL || `https://picsum.photos/seed/vinyl-${album.albumID}/800/800`}
                            alt={album.title}
                            onError={e => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = fallbackCover;
                            }}
                            className="h-full w-full object-cover"
                        />
                    </div>
                </div>

                <div className="lg:col-span-7">
                    <div className="border-b-2 border-[var(--line)] pb-8">
                        <div className="text-xs font-black uppercase tracking-[0.22em] text-[var(--blue)]">
                            {album.artist?.name || 'Unknown Artist'}
                        </div>
                        <h1 className="display-font mt-3 text-5xl leading-none md:text-7xl">{album.title}</h1>
                        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
                            <span>{album.genre?.name || 'Vinyl'}</span>
                            <span className="h-1 w-1 rounded-full bg-[var(--line)]"></span>
                            <span>{album.releaseYear || 'Reissue'}</span>
                            <span className="h-1 w-1 rounded-full bg-[var(--line)]"></span>
                            <span className={album.stockQuantity > 0 ? 'text-[var(--coral)]' : 'text-[var(--muted)]'}>
                                {album.stockQuantity > 0 ? `${album.stockQuantity} шт. в наличии` : 'Нет в наличии'}
                            </span>
                        </div>
                    </div>

                    <div className="mt-8 space-y-6">
                        <div>
                            <h3 className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-[var(--muted)]">Описание</h3>
                            <p className="text-lg leading-relaxed text-[var(--ink)]">
                                {album.description || 'Описание отсутствует.'}
                            </p>
                        </div>

                        <div className="flex flex-col gap-4 border-t-2 border-[var(--line)] pt-8 sm:flex-row sm:items-center">
                            <div className="flex-1">
                                <div className="text-xs font-black uppercase tracking-[0.18em] text-[var(--muted)]">Цена</div>
                                <div className="text-4xl font-black tabular-nums">{formatPrice(album.price)} ₽</div>
                            </div>
                            <button
                                onClick={() => addToCart(album)}
                                disabled={album.stockQuantity === 0}
                                className="flex items-center justify-center gap-3 border-2 border-[var(--line)] bg-[var(--coral)] px-8 py-5 font-black uppercase tracking-[0.14em] text-white transition-transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                            >
                                <Plus className="h-5 w-5" />
                                В корзину
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
