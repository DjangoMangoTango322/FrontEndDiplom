import { useEffect, useMemo, useState } from 'react';
import api from '../api/api';
import type { Album, Artist, Genre } from '../types';
import AlbumCard from '../components/AlbumCard';
import { ArrowDown, AlertTriangle, Filter, Search, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const makeDemoCover = (title: string, artist: string, seed: number) => {
    const palettes = [
        ['#f05a3b', '#f4c84b', '#15110f'],
        ['#2e5f8f', '#9ed8c3', '#15110f'],
        ['#15110f', '#f4eadf', '#f05a3b'],
        ['#9ed8c3', '#f4c84b', '#2e5f8f'],
        ['#f4c84b', '#f05a3b', '#15110f'],
        ['#f4eadf', '#2e5f8f', '#15110f'],
    ];
    const [bg, accent, ink] = palettes[seed % palettes.length];
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 900"><rect width="900" height="900" fill="${bg}"/><circle cx="450" cy="450" r="292" fill="${accent}" stroke="${ink}" stroke-width="24"/><circle cx="450" cy="450" r="92" fill="${bg}" stroke="${ink}" stroke-width="18"/><path d="M82 112H818M82 788H818" stroke="${ink}" stroke-width="18"/><text x="82" y="216" font-family="Arial Black, Arial" font-size="72" font-weight="900" fill="${ink}">${title.slice(0, 16)}</text><text x="82" y="730" font-family="Arial, sans-serif" font-size="34" font-weight="700" letter-spacing="8" fill="${ink}">${artist.slice(0, 22).toUpperCase()}</text></svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

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

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [albumsRes, artistsRes, genresRes] = await Promise.all([
                    api.get('/albums', { params: { page: 1, pageSize: 5000 } }),
                    api.get('/albums/artists'),
                    api.get('/albums/genres')
                ]);

                setAlbums(albumsRes.data.data || albumsRes.data);
                setArtists(artistsRes.data);
                setGenres(genresRes.data);
                setLoadError(null);
            } catch {
                setAlbums([]);
                setArtists([]);
                setGenres([]);
                setLoadError('Не удалось подключиться к бэкенду. Проверьте, что API запущен на http://localhost:5062/api (или http://127.0.0.1:5062/api), либо задайте VITE_API_URL.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

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
        fetchRecs();
    }, [isAuthenticated]);

    useEffect(() => {
        let result = [...albums];

        if (search) {
            const term = search.toLowerCase();
            result = result.filter(a =>
                a.title.toLowerCase().includes(term) ||
                a.artist?.name.toLowerCase().includes(term) ||
                a.genre?.name.toLowerCase().includes(term)
            );
        }

        if (selectedGenre) result = result.filter(a => a.genreID === selectedGenre);
        if (selectedArtist) result = result.filter(a => a.artistID === selectedArtist);

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

    if (loading) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center px-6">
                <div className="poster-border bg-[var(--paper-soft)] p-10 text-center">
                    <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-[var(--line)] border-t-[var(--coral)]" />
                    <p className="mt-5 font-bold uppercase tracking-[0.18em]">Загружаем виниловую коллекцию</p>
                </div>
            </div>
        );
    }

    return (
        <main>
            <section className="relative overflow-hidden border-b-2 border-[var(--line)]">
                <div className="absolute inset-0 opacity-[0.18]" style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, #15110f 1.2px, transparent 0)',
                    backgroundSize: '22px 22px'
                }} />
                <div className="relative mx-auto grid max-w-7xl gap-10 px-5 py-16 md:px-8 lg:grid-cols-12 lg:py-20">
                    <div className="lg:col-span-7">
                        <h1 className="display-font max-w-5xl text-[clamp(3.8rem,10vw,9.4rem)] leading-[0.82]">
                            RECORDS<br />FOR LOUD<br />ROOMS
                        </h1>
                        <p className="mt-7 max-w-2xl text-xl font-medium leading-8 text-[var(--muted)]">
                            Светлый, постерный каталог винила: альбомы выглядят как афиши, фильтры работают быстро,
                            а редкие релизы не тонут в тёмном интерфейсе.
                        </p>
                        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                            <button
                                onClick={() => document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' })}
                                className="inline-flex items-center justify-center gap-3 border-2 border-[var(--line)] bg-[var(--coral)] px-7 py-4 font-black uppercase tracking-[0.14em] text-white poster-border-sm"
                            >
                                Смотреть каталог <ArrowDown className="h-5 w-5" />
                            </button>
                            <div className="border-2 border-[var(--line)] bg-[var(--sun)] px-7 py-4 font-black uppercase tracking-[0.14em]">
                                {stats.count} релизов
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-5 lg:self-end">
                        <div className="poster-border rotate-1 bg-[var(--paper-soft)] p-5">
                            <div className="border-b-2 border-[var(--line)] pb-4 text-xs font-black uppercase tracking-[0.18em] text-[var(--coral)]">
                                Витрина недели
                            </div>
                            <div className="grid grid-cols-3 gap-3 pt-5">
                                {albums.slice(0, 3).map((album, index) => (
                                    <img
                                        key={album.albumID}
                                        src={album.imageURL || `https://picsum.photos/seed/${album.albumID}/500/500`}
                                        alt={album.title}
                                        onError={e => {
                                            e.currentTarget.onerror = null;
                                            e.currentTarget.src = makeDemoCover(album.title, album.artist?.name || 'Vinyl Store', album.albumID);
                                        }}
                                        className={`aspect-square w-full border-2 border-[var(--line)] object-cover ${index === 1 ? 'translate-y-8' : ''}`}
                                    />
                                ))}
                            </div>
                            <div className="mt-10 grid grid-cols-3 border-t-2 border-[var(--line)] pt-4 text-center">
                                <div>
                                    <div className="display-font text-4xl">{stats.genres}</div>
                                    <div className="text-xs font-black uppercase text-[var(--muted)]">жанра</div>
                                </div>
                                <div className="border-x-2 border-[var(--line)]">
                                    <div className="display-font text-4xl">{stats.oldest || 'LP'}</div>
                                    <div className="text-xs font-black uppercase text-[var(--muted)]">архив</div>
                                </div>
                                <div>
                                    <div className="display-font text-4xl">LP</div>
                                    <div className="text-xs font-black uppercase text-[var(--muted)]">формат</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section id="catalog" className="mx-auto max-w-7xl px-5 py-12 md:px-8">
                {loadError && (
                    <div className="mb-8 flex items-start gap-3 border-2 border-[var(--line)] bg-red-100 p-4 font-bold text-red-900">
                        <AlertTriangle className="mt-1 h-5 w-5" />
                        <span>{loadError}</span>
                    </div>
                )}

                {isAuthenticated && (
                    <div className="mb-12 border-y-2 border-[var(--line)] py-8">
                        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
                            <div>
                                <div className="text-xs font-black uppercase tracking-[0.2em] text-[var(--coral)]">Подборка</div>
                                <h2 className="display-font mt-2 text-5xl leading-none">Рекомендации по Spotify</h2>
                                <p className="mt-3 max-w-2xl text-[var(--muted)]">Подбираем винил по любимым артистам и жанрам.</p>
                            </div>
                        </div>

                        {recLoading ? (
                            <div className="mt-6 border-2 border-[var(--line)] bg-[var(--paper-soft)] p-7 font-bold">Считаем рекомендации...</div>
                        ) : recommended.length > 0 ? (
                            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                                {recommended.map(album => <AlbumCard key={`rec-${album.albumID}`} album={album} />)}
                            </div>
                        ) : (
                            <div className="mt-6 border-2 border-[var(--line)] bg-[var(--paper-soft)] p-7 font-bold">
                                Войдите через Spotify, чтобы получить персональную полку.
                            </div>
                        )}
                    </div>
                )}

                <div className="sticky top-[78px] z-40 mb-10 border-2 border-[var(--line)] bg-[var(--paper-soft)] p-4 shadow-[0_8px_0_rgba(21,17,15,0.16)]">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--coral)]" />
                            <input
                                type="text"
                                placeholder="Поиск по названию, артисту или жанру"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="h-13 w-full border-2 border-[var(--line)] bg-white py-3 pl-12 pr-4 text-base font-bold outline-none focus:bg-[var(--sun)]/20"
                            />
                        </div>

                        <select
                            value={selectedGenre || ''}
                            onChange={e => setSelectedGenre(e.target.value ? Number(e.target.value) : null)}
                            className="h-13 border-2 border-[var(--line)] bg-white px-4 py-3 font-bold outline-none"
                        >
                            <option value="">Все жанры</option>
                            {genres.map(g => <option key={g.genreID} value={g.genreID}>{g.name}</option>)}
                        </select>

                        <select
                            value={selectedArtist || ''}
                            onChange={e => setSelectedArtist(e.target.value ? Number(e.target.value) : null)}
                            className="h-13 border-2 border-[var(--line)] bg-white px-4 py-3 font-bold outline-none"
                        >
                            <option value="">Все артисты</option>
                            {artists.map(a => <option key={a.artistID} value={a.artistID}>{a.name}</option>)}
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
                        <span className="ml-3 text-lg font-bold text-[var(--muted)]">альбомов найдено</span>
                    </div>
                    {hasActiveFilters && (
                        <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.14em] text-[var(--coral)]">
                            <Filter className="h-4 w-4" /> Фильтры активны
                        </div>
                    )}
                </div>

                {filtered.length > 0 ? (
                    <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {filtered.map(album => <AlbumCard key={album.albumID} album={album} />)}
                    </div>
                ) : (
                    <div className="border-2 border-[var(--line)] bg-[var(--paper-soft)] p-12 text-center poster-border-sm">
                        <h3 className="display-font text-5xl">Ничего не найдено</h3>
                        <p className="mx-auto mt-4 max-w-md text-[var(--muted)]">Попробуйте изменить поиск или сбросить фильтры.</p>
                        <button onClick={clearFilters} className="mt-7 border-2 border-[var(--line)] bg-[var(--sun)] px-6 py-3 font-black uppercase tracking-[0.14em]">
                            Сбросить все фильтры
                        </button>
                    </div>
                )}
            </section>
        </main>
    );
}
