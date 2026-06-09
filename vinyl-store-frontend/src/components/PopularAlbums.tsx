import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Disc, Flame, ArrowRight } from 'lucide-react';
import api from '../api/api';
import type { Album } from '../types';

const formatPrice = (value: number) => value.toLocaleString('ru-RU');

export default function PopularAlbums() {
    const [popular, setPopular] = useState<Album[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchPopular = async () => {
            try {
                const response = await api.get<any>('/albums/popular?count=5');
                if (Array.isArray(response.data)) {
                    setPopular(response.data);
                } else if (response.data && Array.isArray(response.data.data)) {
                    setPopular(response.data.data);
                }
            } catch (err) {
                setError('Не удалось загрузить чарт');
            } finally {
                setLoading(false);
            }
        };
        void fetchPopular();
    }, []);

    if (loading || error || popular.length === 0) return null;

    return (
        <section className="my-12">
            <div className="mb-6 border-b-2 border-[var(--line)] pb-3 flex items-center gap-2">
                <Flame className="h-6 w-6 text-[var(--coral)] animate-pulse" />
                <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--coral)]">Горячие продажи</div>
                    <h2 className="display-font text-3xl md:text-5xl mt-0.5">Топ пластинок</h2>
                </div>
            </div>

            <div className="border-2 border-[var(--line)] bg-white divide-y-2 divide-[var(--line)] overflow-hidden">
                {popular.map((album, index) => (
                    <div
                        key={album.albumID}
                        onClick={() => navigate(`/album/${album.albumID}`)}
                        className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 hover:bg-[var(--sun)]/10 cursor-pointer transition-colors relative"
                    >
                        {/* Левая часть */}
                        <div className="flex items-center gap-3 sm:gap-6 min-w-0">
                            {/* Номер: уменьшен для микро-экранов, фиксированная ширина */}
                            <span className="display-font text-3xl xs:text-4xl md:text-5xl text-[var(--line)] opacity-30 group-hover:opacity-100 group-hover:text-[var(--coral)] transition-all select-none tabular-nums w-10 flex-shrink-0">
                                #{index + 1}
                            </span>

                            {/* Обложка: скрыта на экранах меньше 375px (xs), чтобы не жрать место */}
                            <div className="h-12 w-12 border-2 border-[var(--line)] bg-[var(--paper-soft)] flex-shrink-0 relative overflow-hidden hidden xs:block">
                                {album.imageURL ? (
                                    <img src={album.imageURL} alt={album.title} className="h-full w-full object-cover" />
                                ) : (
                                    <Disc className="h-6 w-6 m-2 text-[var(--muted)]" />
                                )}
                            </div>

                            {/* Текстовая инфо с защитой от переполнения (min-w-0 + truncate) */}
                            <div className="min-w-0 flex-1">
                                <h3 className="font-black text-base xs:text-lg leading-tight truncate group-hover:text-[var(--coral)] transition-colors">
                                    {album.title}
                                </h3>
                                <p className="text-xs xs:text-sm font-semibold text-[var(--muted)] mt-0.5 truncate">
                                    {album.artist?.name || 'Неизвестный артист'}
                                </p>
                            </div>
                        </div>

                        {/* Правая часть */}
                        <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-none border-[var(--line)]/10 pt-2 sm:pt-0">
                            <div className="font-black text-base xs:text-lg tabular-nums">
                                {formatPrice(album.price)} ₽
                            </div>

                            <span className="inline-block px-2 py-0.5 bg-[var(--paper-soft)] text-[10px] font-black uppercase border border-[var(--line)]/30 sm:hidden">
                                {album.genre?.name}
                            </span>

                            <div className="h-9 w-9 border-2 border-[var(--line)] bg-white group-hover:bg-[var(--ink)] group-hover:text-white hidden sm:grid place-items-center transition-colors">
                                <ArrowRight className="h-4 w-4 transform group-hover:translate-x-0.5 transition-transform" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}