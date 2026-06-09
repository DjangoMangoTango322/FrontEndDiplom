import { useEffect, useMemo, useState } from 'react';
import api from '../api/api';
import type { Album, Artist, Genre } from '../types';
import AlbumCard from '../components/AlbumCard';
import { AlertTriangle, ArrowDown, Disc3, Filter, Package, Search, Truck, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PopularAlbums from '../components/PopularAlbums';
import WeeklyShowcase from '../components/WeeklyShowcase';

const CATALOG_PAGE_SIZE = 100;

type CatalogResponse = {
    data: Album[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
};

const serviceCards = [
    {
        title: 'Новые релизы и переиздания',
        text: 'Собираем свежие LP, культовые переиздания и альбомы, которые хочется слушать целиком.',
        Icon: Disc3,
    },
    {
        title: 'Подбор по жанрам и артистам',
        text: 'Фильтры помогают быстро найти джаз, рок, электронику, хип-хоп и пластинки любимых исполнителей.',
        Icon: Package,
    },
    {
        title: 'Упаковка и доставка',
        text: 'Пластинки отправляются в плотной защитной упаковке, чтобы обложка и диск приехали аккуратно.',
        Icon: Truck,
    },
];

export default function Catalog() {
    const [albums, setAlbums] = useState<Album[]>([]);
    const [filtered, setFiltered] = useState<Album[]>([]);
    const [artists, setArtists] = useState<Artist[]>([]);
    const [genres, setGenres] = useState<Genre[]>([]);
    const [recommended, setRecommended] = useState<Album[]>([]);
    const [recLoading, setRecLoading] = useState(false);

    const [search, setSearch] = useState('');
    const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
    const [selectedArtist, setSelectedArtist] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const { isAuthenticated } = useAuth();

    // 1. Хук загрузки всех данных
    useEffect(() => {
        const fetchAllAlbums = async () => {
            const firstPage = await api.get<CatalogResponse>('/albums', {
                params: { page: 1, pageSize: CATALOG_PAGE_SIZE }
            });

            const { data, totalPages } = firstPage.data;
            if (totalPages <= 1) {
                return data;
            }

            const remainingPages = await Promise.all(
                Array.from({ length: totalPages - 1 }, (_, index) =>
                    api.get<CatalogResponse>('/albums', {
                        params: { page: index + 2, pageSize: CATALOG_PAGE_SIZE }
                    }))
            );

            return [
                ...data,
                ...remainingPages.flatMap(response => response.data.data)
            ];
        };

        const fetchData = async () => {
            try {
                const [albumsRes, artistsRes, genresRes] = await Promise.all([
                    fetchAllAlbums(),
                    api.get('/albums/artists'),
                    api.get('/albums/genres')
                ]);

                setAlbums(albumsRes);
                setArtists(artistsRes.data);
                setGenres(genresRes.data);
                setLoadError(null);
            } catch {
                setAlbums([]);
                setArtists([]);
                setGenres([]);
                setLoadError('Не удалось подключиться к каталогу. Проверьте, что API запущен, и обновите страницу.');
            } finally {
                setLoading(false);
            }
        };

        void fetchData();
    }, []);

    // 2. Хук загрузки рекомендаций
    useEffect(() => {
        const fetchRecs = async () => {
            if (!isAuthenticated) {
                setRecommended([]);
                return;
            }

            try {
                setRecLoading(true);
                const res = await api.get<Album[]>('/recommendations', { params: { limit: 10 } });
                setRecommended(res.data);
            } catch {
                setRecommended([]);
            } finally {
                setRecLoading(false);
            }
        };

        void fetchRecs();
    }, [isAuthenticated]);

    // 3. Хук фильтрации и поиска
    useEffect(() => {
        let result = [...albums];

        if (selectedGenre) {
            result = result.filter(album => album.genreID === selectedGenre);
        }

        if (selectedArtist) {
            result = result.filter(album => album.artistID === selectedArtist);
        }

        if (search.trim()) {
            const term = search.trim();
            const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const wordBoundaryRegex = new RegExp(`(^|[\\s\\-.,()/])${escapedTerm}`, 'i');

            result = result.filter(album => {
                const title = album.title || '';
                const artistName = album.artist?.name || '';
                return wordBoundaryRegex.test(title) || wordBoundaryRegex.test(artistName);
            });

            const termLower = term.toLowerCase();
            result.sort((a, b) => {
                const titleA = a.title ? a.title.toLowerCase().trim() : '';
                const artistA = a.artist?.name ? a.artist.name.toLowerCase().trim() : '';
                const titleB = b.title ? b.title.toLowerCase().trim() : '';
                const artistB = b.artist?.name ? b.artist.name.toLowerCase().trim() : '';

                const aStarts = titleA.startsWith(termLower) || artistA.startsWith(termLower);
                const bStarts = titleB.startsWith(termLower) || artistB.startsWith(termLower);

                if (aStarts && !bStarts) return -1;
                if (!aStarts && bStarts) return 1;

                return titleA.localeCompare(titleB);
            });
        }

        setFiltered(result);
    }, [search, selectedGenre, selectedArtist, albums]);

    const clearFilters = () => {
        setSearch('');
        setSelectedGenre(null);
        setSelectedArtist(null);
    };

    const hasActiveFilters = Boolean(search || selectedGenre || selectedArtist);

    const stats = useMemo(() => {
        const genresCount = new Set(albums.map(album => album.genreID)).size;
        const years = albums.map(album => album.releaseYear).filter(Boolean) as number[];
        return {
            count: albums.length,
            genres: genresCount,
            oldest: years.length ? Math.min(...years) : null,
        };
    }, [albums]);

    const genreLabels = genres.length > 0
        ? genres.slice(0, 5).map(genre => genre.name)
        : ['Jazz', 'Rock', 'Soul', 'Hip-hop', 'Electronic'];

    return (
        <main>
            <section className="relative overflow-hidden border-b-2 border-[var(--line)]">
                <div className="absolute inset-0 opacity-[0.18]" style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, #15110f 1.2px, transparent 0)',
                    backgroundSize: '22px 22px'
                }} />
                <div className="relative mx-auto grid max-w-7xl gap-10 px-5 py-16 md:px-8 lg:grid-cols-12 lg:py-20">
                    <div className="lg:col-span-7">
                        <div className="mb-5 inline-flex border-2 border-[var(--line)] bg-[var(--sun)] px-4 py-2 text-xs font-black uppercase tracking-[0.18em]">
                            Магазин виниловых пластинок
                        </div>
                        <h1 className="display-font max-w-5xl text-[clamp(3.6rem,9vw,8.6rem)] leading-[0.86]">
                            Винил для домашней коллекции
                        </h1>
                        <p className="mt-7 max-w-2xl text-xl font-medium leading-8 text-[var(--muted)]">
                            Каталог пластинок для тех, кто выбирает музыку не фоном, а целым ритуалом:
                            LP, переиздания, редкие альбомы и подарочные релизы с выразительными обложками.
                        </p>
                        <div className="mt-7 flex flex-wrap gap-2">
                            {genreLabels.map(label => (
                                <span key={label} className="border-2 border-[var(--line)] bg-[var(--paper-soft)] px-3 py-1 text-xs font-black uppercase tracking-[0.12em]">
                                    {label}
                                </span>
                            ))}
                        </div>
                        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                            <button
                                onClick={() => document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' })}
                                className="inline-flex items-center justify-center gap-3 border-2 border-[var(--line)] bg-[var(--coral)] px-7 py-4 font-black uppercase tracking-[0.14em] text-white poster-border-sm"
                            >
                                Смотреть пластинки <ArrowDown className="h-5 w-5" />
                            </button>
                            <div className="border-2 border-[var(--line)] bg-[var(--paper-soft)] px-7 py-4 font-black uppercase tracking-[0.14em]">
                                {stats.count || '5000+'} релизов
                            </div>
                        </div>
                    </div>

                    {/* ДИНАМИЧЕСКАЯ ВИТРИНА НЕДЕЛИ */}
                    <div className="lg:col-span-5 lg:self-end">
                        <WeeklyShowcase />
                    </div>
                </div>
            </section>

            <section className="mx-auto grid max-w-7xl gap-5 px-5 py-10 md:grid-cols-3 md:px-8">
                {serviceCards.map(({ title, text, Icon }) => (
                    <article key={title} className="border-2 border-[var(--line)] bg-[var(--paper-soft)] p-5">
                        <Icon className="h-7 w-7 text-[var(--coral)]" />
                        <h2 className="mt-4 text-lg font-black uppercase tracking-[0.08em]">{title}</h2>
                        <p className="mt-3 text-sm font-semibold leading-6 text-[var(--muted)]">{text}</p>
                    </article>
                ))}
            </section>

            <section id="catalog" className="mx-auto max-w-7xl px-5 py-12 md:px-8">
                {loadError && (
                    <div className="mb-8 flex items-start gap-3 border-2 border-[var(--line)] bg-red-100 p-4 font-bold text-red-900">
                        <AlertTriangle className="mt-1 h-5 w-5" />
                        <span>{loadError}</span>
                    </div>
                )}

                {/* ХИТ-ПАРАД ПОПУЛЯРНЫХ ДИСКОВ */}
                <PopularAlbums />

                {isAuthenticated && (
                    <div className="mb-12 border-y-2 border-[var(--line)] py-8">
                        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
                            <div>
                                <div className="text-xs font-black uppercase tracking-[0.2em] text-[var(--coral)]">Персональная полка</div>
                                <h2 className="display-font mt-2 text-5xl leading-none">Рекомендации по Spotify</h2>
                                <p className="mt-3 max-w-2xl text-[var(--muted)]">
                                    Подбираем пластинки по вашим любимым артистам и жанрам, чтобы проще найти следующий альбом в коллекцию.
                                </p>
                            </div>
                        </div>

                        {recLoading ? (
                            <div className="mt-6 border-2 border-[var(--line)] bg-[var(--paper-soft)] p-7 font-bold">Собираем рекомендации...</div>
                        ) : recommended.length > 0 ? (
                            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                                {recommended.map(album => <AlbumCard key={`rec-${album.albumID}`} album={album} />)}
                            </div>
                        ) : (
                            <div className="mt-6 border-2 border-[var(--line)] bg-[var(--paper-soft)] p-7 font-bold">
                                Когда появятся данные Spotify, здесь будет персональная подборка пластинок под ваш вкус.
                            </div>
                        )}
                    </div>
                )}

                <div className="mb-7">
                    <div className="text-xs font-black uppercase tracking-[0.2em] text-[var(--coral)]">Каталог винила</div>
                    <h2 className="display-font mt-2 text-5xl leading-none md:text-7xl">Подберите альбом под свой проигрыватель</h2>
                    <p className="mt-4 max-w-2xl text-lg leading-7 text-[var(--muted)]">
                        Поиск по каталогу виниловых пластинок работает по названию альбома, артисту и жанру.
                    </p>
                </div>

                <div className="sticky top-[78px] z-40 mb-10 border-2 border-[var(--line)] bg-[var(--paper-soft)] p-4 shadow-[0_8px_0_rgba(21,17,15,0.16)]">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--coral)]" />
                            <input
                                type="text"
                                placeholder="Например: Kind of Blue, Radiohead"
                                value={search}
                                onChange={event => setSearch(event.target.value)}
                                className="h-13 w-full border-2 border-[var(--line)] bg-white py-3 pl-12 pr-4 text-base font-bold outline-none focus:bg-[var(--sun)]/20"
                            />
                        </div>

                        <select
                            value={selectedGenre || ''}
                            onChange={event => setSelectedGenre(event.target.value ? Number(event.target.value) : null)}
                            className="h-13 border-2 border-[var(--line)] bg-white px-4 py-3 font-bold outline-none cursor-pointer"
                        >
                            <option value="">Все жанры</option>
                            {genres.map(genre => <option key={genre.genreID} value={genre.genreID}>{genre.name}</option>)}
                        </select>

                        <select
                            value={selectedArtist || ''}
                            onChange={event => setSelectedArtist(event.target.value ? Number(event.target.value) : null)}
                            className="h-13 border-2 border-[var(--line)] bg-white px-4 py-3 font-bold outline-none cursor-pointer"
                        >
                            <option value="">Все артисты</option>
                            {artists.map(artist => <option key={artist.artistID} value={artist.artistID}>{artist.name}</option>)}
                        </select>

                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="inline-flex h-13 items-center justify-center gap-2 border-2 border-[var(--line)] bg-[var(--ink)] px-5 py-3 font-black uppercase tracking-[0.12em] text-white"
                            >
                                <X className="h-4 w-4" /> Сброс
                            </button>
                        )}
                    </div>
                </div>

                <div className="mb-8 flex flex-col justify-between gap-3 border-b-2 border-[var(--line)] pb-5 sm:flex-row sm:items-end">
                    <div>
                        <span className="display-font text-6xl leading-none">{filtered.length}</span>
                        <span className="ml-3 text-lg font-bold text-[var(--muted)]">пластинок найдено</span>
                    </div>
                    {hasActiveFilters && (
                        <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.14em] text-[var(--coral)]">
                            <Filter className="h-4 w-4" /> Фильтры активны
                        </div>
                    )}
                </div>

                {loading ? (
                    <div>
                        <div className="mb-7 border-2 border-[var(--line)] bg-[var(--paper-soft)] p-7 font-bold">
                            Загружаем каталог пластинок...
                        </div>
                        <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {Array.from({ length: 4 }).map((_, index) => (
                                <div key={index} className="h-[420px] animate-pulse border-2 border-[var(--line)] bg-[var(--paper-soft)]" />
                            ))}
                        </div>
                    </div>
                ) : filtered.length > 0 ? (
                    <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {filtered.map(album => <AlbumCard key={album.albumID} album={album} />)}
                    </div>
                ) : (
                    <div className="border-2 border-[var(--line)] bg-[var(--paper-soft)] p-12 text-center poster-border-sm">
                        <h3 className="display-font text-5xl">Пластинки не найдены</h3>
                        <p className="mx-auto mt-4 max-w-md text-[var(--muted)]">
                            Попробуйте изменить запрос, выбрать другой жанр или сбросить фильтры, чтобы снова увидеть весь каталог винила.
                        </p>
                        <button onClick={clearFilters} className="mt-7 border-2 border-[var(--line)] bg-[var(--sun)] px-6 py-3 font-black uppercase tracking-[0.14em]">
                            Сбросить все фильтры
                        </button>
                    </div>
                )}
            </section>
        </main>
    );
}