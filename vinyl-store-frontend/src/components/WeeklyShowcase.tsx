import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Disc } from 'lucide-react';
import api from '../api/api';
import type { Album } from '../types';

const makeDemoCover = (title: string, seed: number) => {
    const palettes = [
        ['#f05a3b', '#f4c84b', '#15110f'],
        ['#2e5f8f', '#9ed8c3', '#15110f'],
        ['#15110f', '#f4eadf', '#f05a3b']
    ];
    const [bg, accent, ink] = palettes[seed % palettes.length];
    const safeTitle = title.replace(/[<&>"]/g, '');

    // Переменная safeArtist удалена, так как в SVG используется только название альбома
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 900"><rect width="900" height="900" fill="${bg}"/><circle cx="450" cy="450" r="292" fill="${accent}" stroke="${ink}" stroke-width="24"/><circle cx="450" cy="450" r="92" fill="${bg}" stroke="${ink}" stroke-width="18"/><text x="82" y="216" font-family="Arial Black, Arial" font-size="72" font-weight="900" fill="${ink}">${safeTitle.slice(0, 16)}</text></svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

export default function WeeklyShowcase() {
    const [showcase, setShowcase] = useState<Album[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchShowcase = async () => {
            try {
                const response = await api.get<Album[]>('/albums/popular?count=3');
                setShowcase(response.data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        void fetchShowcase();
    }, []);

    if (loading || showcase.length === 0) return null;

    return (
        <div className="poster-border rotate-0 xs:rotate-1 bg-[var(--paper-soft)] p-4 xs:p-5 transition-transform hover:rotate-0 duration-300 shadow-[4px_4px_0px_0px_var(--line)]">
            <div className="border-b-2 border-[var(--line)] pb-3 text-xs font-black uppercase tracking-[0.18em] text-[var(--coral)] flex justify-between items-center">
                <span>Витрина недели</span>
                <span className="h-2 w-2 rounded-full bg-[var(--coral)] animate-ping" />
            </div>

            {/* Сетка адаптирована под сверхмалые дисплеи */}
            <div className="grid grid-cols-3 gap-2 xs:gap-3 pt-4 pb-2 xs:pb-6">
                {showcase.map((album, index) => {
                    const coverSrc = album.imageURL || makeDemoCover(album.title, album.albumID);

                    return (
                        <div
                            key={album.albumID}
                            onClick={() => navigate(`/album/${album.albumID}`)}
                            className={`group aspect-square w-full border-2 border-[var(--line)] bg-white object-cover cursor-pointer relative overflow-hidden transition-all duration-300 hover:scale-105 ${
                                index === 1 ? 'translate-y-3 xs:translate-y-6' : ''
                            }`}
                        >
                            <img
                                src={coverSrc}
                                alt={album.title}
                                className="h-full w-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Disc className="text-white h-5 w-5 xs:h-7 xs:w-7 animate-spin" />
                            </div>
                        </div>
                    );
                })}
            </div>

            <p className="mt-6 xs:mt-10 border-t-2 border-[var(--line)] pt-3 text-xs xs:text-sm font-bold leading-relaxed text-[var(--muted)]">
                Кликните на любую пластинку, чтобы изучить описание и оформить заказ.
            </p>
        </div>
    );
}