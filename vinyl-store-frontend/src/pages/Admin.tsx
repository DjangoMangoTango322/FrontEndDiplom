import { useEffect, useState } from 'react';
import api from '../api/api';
import type { Album, Artist, Genre } from '../types';
import { Plus, Trash2, Edit } from 'lucide-react';

export default function Admin() {
    const [albums, setAlbums] = useState<Album[]>([]);
    const [artists, setArtists] = useState<Artist[]>([]);
    const [genres, setGenres] = useState<Genre[]>([]);
    const [loading, setLoading] = useState(true);

    const [newAlbum, setNewAlbum] = useState({
        title: '',
        artistID: 0,
        genreID: 0,
        releaseYear: 2024,
        price: 2500,
        stockQuantity: 10,
        description: '',
        imageURL: 'https://picsum.photos/seed/vinyl-new/600/600'
    });

    const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [albumsRes, artistsRes, genresRes] = await Promise.all([
                    api.get('/albums', { params: { page: 1, pageSize: 5000 } }),
                    api.get('/albums/artists'),
                    api.get('/albums/genres')
                ]);

                setAlbums(albumsRes.data.data || albumsRes.data);
                setArtists(artistsRes.data);
                setGenres(genresRes.data);

                // Set default IDs
                if (artistsRes.data.length > 0) {
                    setNewAlbum(prev => ({ ...prev, artistID: artistsRes.data[0].artistID }));
                }
                if (genresRes.data.length > 0) {
                    setNewAlbum(prev => ({ ...prev, genreID: genresRes.data[0].genreID }));
                }
            } catch (err) {
                alert('Ошибка загрузки данных');
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const createAlbum = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/albums', newAlbum);
            alert('✅ Альбом успешно добавлен!');
            window.location.reload();
        } catch (err: any) {
            alert('Ошибка: ' + (err.response?.data?.message || err.message));
        }
    };

    const updateAlbum = async () => {
        if (!editingAlbum) return;
        try {
            await api.put(`/albums/${editingAlbum.albumID}`, editingAlbum);
            alert('✅ Альбом обновлён!');
            setEditingAlbum(null);
            window.location.reload();
        } catch (err: any) {
            alert('Ошибка обновления: ' + err.response?.data?.message);
        }
    };

    const deleteAlbum = async (id: number, title: string) => {
        if (!confirm(`Удалить альбом "${title}"?`)) return;
        try {
            await api.delete(`/albums/${id}`);
            alert('Альбом удалён');
            window.location.reload();
        } catch (err) {
            alert('Ошибка удаления');
        }
    };

    if (loading) return <div className="p-10 text-center">Загрузка...</div>;

    return (
        <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="flex items-center justify-between mb-12">
                <div>
                    <h1 className="text-6xl font-bold tracking-tight">Админ-панель</h1>
                    <p className="text-xl text-zinc-400 mt-2">Управление каталогом винилов</p>
                </div>
                <div className="text-right">
                    <div className="text-4xl font-mono text-amber-400">{albums.length}</div>
                    <div className="text-sm text-zinc-500">альбомов в базе</div>
                </div>
            </div>

            {/* Add New Album Form */}
            <div className="bg-zinc-900 rounded-3xl p-10 mb-16 border border-zinc-800">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-amber-400/10 rounded-2xl">
                        <Plus className="w-8 h-8 text-amber-400" />
                    </div>
                    <div>
                        <h2 className="text-4xl font-semibold">Добавить новый альбом</h2>
                        <p className="text-zinc-400">Заполните информацию о пластинке</p>
                    </div>
                </div>

                <form onSubmit={createAlbum} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-zinc-400 mb-2">НАЗВАНИЕ АЛЬБОМА</label>
                        <input
                            placeholder="Dark Side of the Moon"
                            value={newAlbum.title}
                            onChange={e => setNewAlbum({ ...newAlbum, title: e.target.value })}
                            className="w-full bg-zinc-950 border border-zinc-700 focus:border-amber-400 rounded-2xl px-6 py-4 text-xl outline-none"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">АРТИСТ</label>
                        <select
                            value={newAlbum.artistID}
                            onChange={e => setNewAlbum({ ...newAlbum, artistID: +e.target.value })}
                            className="w-full bg-zinc-950 border border-zinc-700 rounded-2xl px-6 py-4 text-lg outline-none focus:border-amber-400"
                            required
                        >
                            {artists.map(a => (
                                <option key={a.artistID} value={a.artistID}>{a.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">ЖАНР</label>
                        <select
                            value={newAlbum.genreID}
                            onChange={e => setNewAlbum({ ...newAlbum, genreID: +e.target.value })}
                            className="w-full bg-zinc-950 border border-zinc-700 rounded-2xl px-6 py-4 text-lg outline-none focus:border-amber-400"
                            required
                        >
                            {genres.map(g => (
                                <option key={g.genreID} value={g.genreID}>{g.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">ГОД ВЫПУСКА</label>
                        <input
                            type="number"
                            value={newAlbum.releaseYear}
                            onChange={e => setNewAlbum({ ...newAlbum, releaseYear: +e.target.value })}
                            className="w-full bg-zinc-950 border border-zinc-700 rounded-2xl px-6 py-4 text-xl outline-none focus:border-amber-400"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">ЦЕНА (₽)</label>
                        <input
                            type="number"
                            value={newAlbum.price}
                            onChange={e => setNewAlbum({ ...newAlbum, price: +e.target.value })}
                            className="w-full bg-zinc-950 border border-zinc-700 rounded-2xl px-6 py-4 text-xl outline-none focus:border-amber-400"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">КОЛИЧЕСТВО НА СКЛАДЕ</label>
                        <input
                            type="number"
                            value={newAlbum.stockQuantity}
                            onChange={e => setNewAlbum({ ...newAlbum, stockQuantity: +e.target.value })}
                            className="w-full bg-zinc-950 border border-zinc-700 rounded-2xl px-6 py-4 text-xl outline-none focus:border-amber-400"
                            required
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-zinc-400 mb-2">ССЫЛКА НА ОБЛОЖКУ (опционально)</label>
                        <input
                            placeholder="https://picsum.photos/id/1015/600/600"
                            value={newAlbum.imageURL}
                            onChange={e => setNewAlbum({ ...newAlbum, imageURL: e.target.value })}
                            className="w-full bg-zinc-950 border border-zinc-700 rounded-2xl px-6 py-4 text-lg outline-none focus:border-amber-400"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-zinc-400 mb-2">ОПИСАНИЕ</label>
                        <textarea
                            placeholder="Краткое описание альбома..."
                            value={newAlbum.description}
                            onChange={e => setNewAlbum({ ...newAlbum, description: e.target.value })}
                            rows={3}
                            className="w-full bg-zinc-950 border border-zinc-700 rounded-2xl px-6 py-4 text-lg outline-none focus:border-amber-400 resize-y"
                        />
                    </div>

                    <button
                        type="submit"
                        className="md:col-span-2 mt-4 bg-gradient-to-r from-amber-400 to-yellow-400 hover:brightness-110 text-black py-5 rounded-2xl text-xl font-bold flex items-center justify-center gap-3 transition-all active:scale-[0.985]"
                    >
                        <Plus className="w-6 h-6" /> ДОБАВИТЬ АЛЬБОМ В МАГАЗИН
                    </button>
                </form>
            </div>

            {/* Albums List */}
            <div>
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-4xl font-semibold">Все альбомы в магазине</h2>
                    <div className="text-sm text-zinc-500">{albums.length} записей</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {albums.map(album => (
                        <div key={album.albumID} className="bg-zinc-900 rounded-3xl overflow-hidden group border border-zinc-800 hover:border-zinc-700 transition-all">
                            <div className="relative">
                                <img
                                    src={album.imageURL || `https://picsum.photos/seed/${album.albumID}/600/600`}
                                    className="w-full aspect-video object-cover"
                                    alt={album.title}
                                />
                                <div className="absolute top-4 right-4 flex gap-2">
                                    <button
                                        onClick={() => setEditingAlbum(album)}
                                        className="p-2.5 bg-black/70 rounded-xl hover:bg-white/10 transition-colors"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => deleteAlbum(album.albumID, album.title)}
                                        className="p-2.5 bg-black/70 rounded-xl hover:bg-red-500/80 text-red-400 hover:text-white transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-6">
                                <div className="font-semibold text-2xl line-clamp-1">{album.title}</div>
                                <div className="text-amber-400 text-lg">{album.artist?.name}</div>

                                <div className="flex justify-between items-end mt-6">
                                    <div>
                                        <div className="text-3xl font-bold tabular-nums">{album.price}</div>
                                        <div className="text-xs text-zinc-500 -mt-1">РУБ</div>
                                    </div>
                                    <div className="text-right text-sm text-zinc-400">
                                        {album.stockQuantity} шт.
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Edit Modal */}
            {editingAlbum && (
                <div className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-6">
                    <div className="bg-zinc-900 rounded-3xl p-10 w-full max-w-2xl border border-zinc-700">
                        <h3 className="text-3xl font-bold mb-8">Редактировать альбом</h3>

                        <div className="space-y-6">
                            <input
                                value={editingAlbum.title}
                                onChange={e => setEditingAlbum({ ...editingAlbum, title: e.target.value })}
                                className="w-full bg-zinc-950 border border-zinc-700 rounded-2xl px-6 py-4 text-xl"
                            />

                            <div className="grid grid-cols-2 gap-6">
                                <input
                                    type="number"
                                    value={editingAlbum.price}
                                    onChange={e => setEditingAlbum({ ...editingAlbum, price: +e.target.value })}
                                    className="bg-zinc-950 border border-zinc-700 rounded-2xl px-6 py-4 text-xl"
                                />
                                <input
                                    type="number"
                                    value={editingAlbum.stockQuantity}
                                    onChange={e => setEditingAlbum({ ...editingAlbum, stockQuantity: +e.target.value })}
                                    className="bg-zinc-950 border border-zinc-700 rounded-2xl px-6 py-4 text-xl"
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 mt-10">
                            <button
                                onClick={() => setEditingAlbum(null)}
                                className="flex-1 py-4 rounded-2xl border border-zinc-700 hover:bg-zinc-800 transition-colors"
                            >
                                Отмена
                            </button>
                            <button
                                onClick={updateAlbum}
                                className="flex-1 py-4 bg-amber-400 text-black rounded-2xl font-semibold hover:bg-amber-300 transition-all"
                            >
                                Сохранить изменения
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}