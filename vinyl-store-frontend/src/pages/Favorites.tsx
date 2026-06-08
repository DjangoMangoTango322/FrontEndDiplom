import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import AlbumCard from '../components/AlbumCard';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';

export default function Favorites() {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const { favorites, isFavoritesLoading } = useFavorites();

    if (!isAuthenticated) {
        return (
            <main className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center px-5 py-16 text-center">
                <div className="poster-border bg-[var(--paper-soft)] p-8 md:p-12">
                    <Heart className="mx-auto h-16 w-16 text-[var(--coral)]" />
                    <h1 className="display-font mt-6 text-5xl leading-none md:text-7xl">Избранное доступно после входа</h1>
                    <p className="mx-auto mt-5 max-w-lg text-lg leading-7 text-[var(--muted)]">
                        Авторизуйтесь, чтобы сохранять понравившиеся пластинки и быстро возвращаться к ним позже.
                    </p>
                    <button
                        onClick={() => navigate('/login?next=/favorites')}
                        className="mt-8 border-2 border-[var(--line)] bg-[var(--ink)] px-8 py-4 font-black uppercase tracking-[0.14em] text-white"
                    >
                        Войти
                    </button>
                </div>
            </main>
        );
    }

    return (
        <main className="mx-auto max-w-7xl px-5 py-12 md:px-8">
            <div className="mb-10 border-b-2 border-[var(--line)] pb-8">
                <div className="text-xs font-black uppercase tracking-[0.22em] text-[var(--coral)]">Ваша коллекция</div>
                <h1 className="display-font mt-2 text-6xl leading-none md:text-9xl">Избранное</h1>
                <p className="mt-5 max-w-2xl text-lg leading-7 text-[var(--muted)]">
                    Сохраняйте интересные релизы, чтобы быстро вернуться к ним перед следующей покупкой.
                </p>
            </div>

            {isFavoritesLoading ? (
                <div className="border-2 border-[var(--line)] bg-[var(--paper-soft)] p-8 font-bold">
                    Загружаем избранные пластинки...
                </div>
            ) : favorites.length > 0 ? (
                <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {favorites.map(album => <AlbumCard key={album.albumID} album={album} />)}
                </div>
            ) : (
                <div className="poster-border-sm border-2 border-[var(--line)] bg-[var(--paper-soft)] p-12 text-center">
                    <Heart className="mx-auto h-12 w-12 text-[var(--coral)]" />
                    <h2 className="display-font mt-6 text-5xl leading-none">Пока пусто</h2>
                    <p className="mx-auto mt-4 max-w-xl text-lg leading-7 text-[var(--muted)]">
                        Нажимайте на сердечко у альбомов в каталоге, и они будут появляться здесь.
                    </p>
                    <button
                        onClick={() => navigate('/')}
                        className="mt-8 border-2 border-[var(--line)] bg-[var(--sun)] px-8 py-4 font-black uppercase tracking-[0.14em]"
                    >
                        Открыть каталог
                    </button>
                </div>
            )}
        </main>
    );
}
