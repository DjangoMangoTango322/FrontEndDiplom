import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { AlertTriangle, Edit, FileText, Plus, RefreshCcw, Search, Shield, Trash2, Upload, Package, AlertCircle } from 'lucide-react';
import api from '../api/api';
import ConfirmDialog from '../components/ConfirmDialog';
import Toast, { type ToastState } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import type { Album, Artist, Genre } from '../types';
import {
    buildAlbumPayload,
    type AdminAlbumForm,
    type AdminAlbumFormErrors,
    albumToAdminForm,
    createEmptyAlbumForm,
    validateAdminAlbumForm,
} from '../utils/adminAlbumValidation';
import {
    mapParsedRowsToImportPayload,
    parseAlbumImportText,
    type ParsedAlbumImportRow,
    type ParsedImportValidationError,
    validateParsedImportRows,
} from '../utils/adminAlbumImport';

// Добавляем хелпер для цены
const formatPrice = (value: number) => value.toLocaleString('ru-RU');

// --- ТИПЫ ДЛЯ ЗАКАЗОВ ---
interface Order {
    orderID: number;
    customerName: string;
    customerPhone: string;
    totalAmount: number;
    status: string;
    orderDate: string;
}

type CatalogResponse = {
    data: Album[];
    totalPages: number;
};

type ImportResult = {
    received: number;
    created: number;
    updated: number;
    failed: number;
    errors: Array<{
        rowNumber: number;
        title?: string;
        message: string;
    }>;
};

const fieldLabels: Record<keyof AdminAlbumForm, string> = {
    title: 'Название альбома',
    artistID: 'Исполнитель',
    genreID: 'Жанр',
    releaseYear: 'Год выпуска',
    price: 'Цена',
    stockQuantity: 'Остаток на складе',
    description: 'Описание',
    imageURL: 'Обложка',
};

const hasFormErrors = (errors: AdminAlbumFormErrors) => Object.keys(errors).length > 0;

const getFirstApiErrorMessage = (payload: unknown) => {
    if (!payload || typeof payload !== 'object') {
        return null;
    }

    const data = payload as {
        message?: string;
        errors?: Record<string, string[]>;
    };

    if (data.message) {
        return data.message;
    }

    const firstFieldErrors = Object.values(data.errors ?? {}).flat();
    return firstFieldErrors[0] ?? null;
};

const mapApiValidationErrors = (payload: unknown): AdminAlbumFormErrors => {
    if (!payload || typeof payload !== 'object') {
        return {};
    }

    const data = payload as {
        errors?: Record<string, string[]>;
    };

    if (!data.errors) {
        return {};
    }

    const entries = Object.entries(data.errors).map(([key, value]) => [key.toLowerCase(), value[0] ?? '']);
    const errorsMap = Object.fromEntries(entries);

    return {
        title: errorsMap.title,
        artistID: errorsMap.artistid,
        genreID: errorsMap.genreid,
        releaseYear: errorsMap.releaseyear,
        price: errorsMap.price,
        stockQuantity: errorsMap.stockquantity,
        description: errorsMap.description,
        imageURL: errorsMap.imageurl,
    };
};

type AlbumFormFieldsProps = {
    form: AdminAlbumForm;
    errors: AdminAlbumFormErrors;
    artists: Artist[];
    genres: Genre[];
    onChange: <K extends keyof AdminAlbumForm>(field: K, value: AdminAlbumForm[K]) => void;
    submitText: string;
    loading: boolean;
    onSubmit: (event: FormEvent) => void;
};

function AlbumFormFields({
                             form,
                             errors,
                             artists,
                             genres,
                             onChange,
                             submitText,
                             loading,
                             onSubmit,
                         }: AlbumFormFieldsProps) {
    const inputClass = 'w-full border-2 border-[var(--line)] bg-white px-5 py-4 font-bold outline-none focus:bg-[var(--sun)]/20';

    return (
        <form onSubmit={onSubmit} className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <label className="md:col-span-2">
                <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-[var(--muted)]">{fieldLabels.title}</span>
                <input value={form.title} onChange={event => onChange('title', event.target.value)} className={inputClass} />
                {errors.title && <div className="mt-2 text-sm font-semibold text-red-700">{errors.title}</div>}
            </label>

            <label>
                <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-[var(--muted)]">{fieldLabels.artistID}</span>
                <select value={form.artistID} onChange={event => onChange('artistID', Number(event.target.value))} className={inputClass}>
                    <option value={0}>Выберите исполнителя</option>
                    {artists.map(artist => <option key={artist.artistID} value={artist.artistID}>{artist.name}</option>)}
                </select>
                {errors.artistID && <div className="mt-2 text-sm font-semibold text-red-700">{errors.artistID}</div>}
            </label>

            <label>
                <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-[var(--muted)]">{fieldLabels.genreID}</span>
                <select value={form.genreID} onChange={event => onChange('genreID', Number(event.target.value))} className={inputClass}>
                    <option value={0}>Выберите жанр</option>
                    {genres.map(genre => <option key={genre.genreID} value={genre.genreID}>{genre.name}</option>)}
                </select>
                {errors.genreID && <div className="mt-2 text-sm font-semibold text-red-700">{errors.genreID}</div>}
            </label>

            <label>
                <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-[var(--muted)]">{fieldLabels.releaseYear}</span>
                <input type="number" value={form.releaseYear} onChange={event => onChange('releaseYear', event.target.value)} className={inputClass} />
                {errors.releaseYear && <div className="mt-2 text-sm font-semibold text-red-700">{errors.releaseYear}</div>}
            </label>

            <label>
                <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-[var(--muted)]">{fieldLabels.price}</span>
                <input type="number" step="0.01" value={form.price} onChange={event => onChange('price', event.target.value)} className={inputClass} />
                {errors.price && <div className="mt-2 text-sm font-semibold text-red-700">{errors.price}</div>}
            </label>

            <label>
                <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-[var(--muted)]">{fieldLabels.stockQuantity}</span>
                <input type="number" value={form.stockQuantity} onChange={event => onChange('stockQuantity', event.target.value)} className={inputClass} />
                {errors.stockQuantity && <div className="mt-2 text-sm font-semibold text-red-700">{errors.stockQuantity}</div>}
            </label>

            <label className="md:col-span-2">
                <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-[var(--muted)]">{fieldLabels.imageURL}</span>
                <input value={form.imageURL} onChange={event => onChange('imageURL', event.target.value)} placeholder="https://example.com/cover.jpg" className={inputClass} />
                {errors.imageURL && <div className="mt-2 text-sm font-semibold text-red-700">{errors.imageURL}</div>}
            </label>

            <label className="md:col-span-2">
                <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-[var(--muted)]">{fieldLabels.description}</span>
                <textarea value={form.description} onChange={event => onChange('description', event.target.value)} rows={4} className={`${inputClass} resize-y`} />
                {errors.description && <div className="mt-2 text-sm font-semibold text-red-700">{errors.description}</div>}
            </label>

            <button type="submit" disabled={loading} className="md:col-span-2 border-2 border-[var(--line)] bg-[var(--ink)] px-6 py-5 font-black uppercase tracking-[0.14em] text-white disabled:opacity-60 hover:bg-gray-800 transition-colors">
                {loading ? 'Сохраняем...' : submitText}
            </button>
        </form>
    );
}

export default function Admin() {
    const { isAuthenticated, role } = useAuth();
    const [activeTab, setActiveTab] = useState<'catalog' | 'import' | 'orders'>('catalog');

    // Стейты каталога
    const [albums, setAlbums] = useState<Album[]>([]);
    const [artists, setArtists] = useState<Artist[]>([]);
    const [genres, setGenres] = useState<Genre[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Стейты заказов
    const [orders, setOrders] = useState<Order[]>([]);
    const [ordersLoading, setOrdersLoading] = useState(false);

    // Стейты форм каталога
    const [createForm, setCreateForm] = useState<AdminAlbumForm>(createEmptyAlbumForm());
    const [createErrors, setCreateErrors] = useState<AdminAlbumFormErrors>({});
    const [createLoading, setCreateLoading] = useState(false);

    const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
    const [editForm, setEditForm] = useState<AdminAlbumForm | null>(null);
    const [editErrors, setEditErrors] = useState<AdminAlbumFormErrors>({});
    const [editLoading, setEditLoading] = useState(false);

    const [pendingDeleteAlbum, setPendingDeleteAlbum] = useState<Album | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Стейты импорта
    const [importRows, setImportRows] = useState<ParsedAlbumImportRow[]>([]);
    const [importValidationErrors, setImportValidationErrors] = useState<ParsedImportValidationError[]>([]);
    const [importFileName, setImportFileName] = useState('');
    const [importOptions, setImportOptions] = useState({
        updateExisting: true,
        createMissingArtists: true,
        createMissingGenres: true,
    });
    const [importLoading, setImportLoading] = useState(false);
    const [importResult, setImportResult] = useState<ImportResult | null>(null);

    const [toast, setToast] = useState<ToastState>({ open: false, type: 'success', title: '' });

    const showToast = (type: ToastState['type'], title: string, description?: string) =>
        setToast({ open: true, type, title, description });

    // --- ФЕТЧ ЗАКАЗОВ ---
    const fetchOrders = async () => {
        setOrdersLoading(true);
        try {
            const response = await api.get<Order[]>('/orders/all');
            setOrders(response.data);
        } catch (error) {
            showToast('error', 'Ошибка', 'Не удалось загрузить список заказов.');
        } finally {
            setOrdersLoading(false);
        }
    };

    // Загружаем заказы, когда переключаемся на вкладку "orders"
    useEffect(() => {
        if (activeTab === 'orders' && orders.length === 0) {
            void fetchOrders();
        }
    }, [activeTab]);

    // Обработка изменения статуса
    const handleStatusChange = async (orderId: number, newStatus: string) => {
        try {
            await api.put(`/orders/${orderId}/status`, { status: newStatus });
            setOrders(prev => prev.map(o => o.orderID === orderId ? { ...o, status: newStatus } : o));
            showToast('success', 'Статус обновлен', `Заказ #${orderId} переведен в статус "${newStatus}"`);
        } catch (error) {
            showToast('error', 'Ошибка', 'Не удалось изменить статус заказа');
        }
    };

    // --- ФЕТЧ КАТАЛОГА ---
    const fetchAllAlbums = async () => {
        const firstPage = await api.get<CatalogResponse>('/albums', { params: { page: 1, pageSize: 100 } });
        const { data, totalPages } = firstPage.data;

        if (totalPages <= 1) {
            return data;
        }

        const remainingPages = await Promise.all(
            Array.from({ length: totalPages - 1 }, (_, index) =>
                api.get<CatalogResponse>('/albums', { params: { page: index + 2, pageSize: 100 } }))
        );

        return [
            ...data,
            ...remainingPages.flatMap(response => response.data.data),
        ];
    };

    const loadData = async () => {
        setLoading(true);

        try {
            const [loadedAlbums, artistsResponse, genresResponse] = await Promise.all([
                fetchAllAlbums(),
                api.get<Artist[]>('/albums/artists'),
                api.get<Genre[]>('/albums/genres'),
            ]);

            setAlbums(loadedAlbums);
            setArtists(artistsResponse.data);
            setGenres(genresResponse.data);
            setCreateForm(previous => ({
                ...previous,
                artistID: previous.artistID || artistsResponse.data[0]?.artistID || 0,
                genreID: previous.genreID || genresResponse.data[0]?.genreID || 0,
            }));
        } catch (error) {
            showToast('error', 'Не удалось загрузить админ-панель', getFirstApiErrorMessage((error as { response?: { data?: unknown } }).response?.data) || 'Проверьте подключение к API и повторите попытку.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadData();
    }, []);

    const filteredAlbums = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) {
            return albums;
        }

        return albums.filter(album =>
            album.title.toLowerCase().includes(term) ||
            album.artist?.name.toLowerCase().includes(term) ||
            album.genre?.name.toLowerCase().includes(term)
        );
    }, [albums, search]);

    const updateCreateField = <K extends keyof AdminAlbumForm>(field: K, value: AdminAlbumForm[K]) => {
        setCreateForm(previous => ({ ...previous, [field]: value }));
        setCreateErrors(previous => {
            const next = { ...previous };
            delete next[field];
            return next;
        });
    };

    const updateEditField = <K extends keyof AdminAlbumForm>(field: K, value: AdminAlbumForm[K]) => {
        if (!editForm) {
            return;
        }

        setEditForm(previous => previous ? { ...previous, [field]: value } : previous);
        setEditErrors(previous => {
            const next = { ...previous };
            delete next[field];
            return next;
        });
    };

    const handleCreateAlbum = async (event: FormEvent) => {
        event.preventDefault();

        const validationErrors = validateAdminAlbumForm(createForm, artists, genres);
        setCreateErrors(validationErrors);

        if (hasFormErrors(validationErrors)) {
            showToast('error', 'Исправьте форму', 'Проверьте обязательные поля перед созданием альбома.');
            return;
        }

        setCreateLoading(true);

        try {
            await api.post('/albums', buildAlbumPayload(createForm));
            showToast('success', 'Альбом добавлен', 'Новая запись появилась в каталоге.');
            setCreateErrors({});
            setCreateForm(createEmptyAlbumForm(artists[0]?.artistID || 0, genres[0]?.genreID || 0));
            await loadData();
        } catch (error) {
            const payload = (error as { response?: { data?: unknown } }).response?.data;
            const apiErrors = mapApiValidationErrors(payload);
            if (hasFormErrors(apiErrors)) {
                setCreateErrors(apiErrors);
            }

            showToast('error', 'Не удалось создать альбом', getFirstApiErrorMessage(payload) || 'Попробуйте еще раз.');
        } finally {
            setCreateLoading(false);
        }
    };

    const openEditModal = (album: Album) => {
        setEditingAlbum(album);
        setEditForm(albumToAdminForm(album));
        setEditErrors({});
    };

    const handleUpdateAlbum = async (event: FormEvent) => {
        event.preventDefault();

        if (!editingAlbum || !editForm) {
            return;
        }

        const validationErrors = validateAdminAlbumForm(editForm, artists, genres);
        setEditErrors(validationErrors);

        if (hasFormErrors(validationErrors)) {
            showToast('error', 'Исправьте форму', 'Редактирование нельзя сохранить с некорректными данными.');
            return;
        }

        setEditLoading(true);

        try {
            await api.put(`/albums/${editingAlbum.albumID}`, buildAlbumPayload(editForm));
            showToast('success', 'Изменения сохранены', 'Карточка альбома обновлена.');
            setEditingAlbum(null);
            setEditForm(null);
            await loadData();
        } catch (error) {
            const payload = (error as { response?: { data?: unknown } }).response?.data;
            const apiErrors = mapApiValidationErrors(payload);
            if (hasFormErrors(apiErrors)) {
                setEditErrors(apiErrors);
            }

            showToast('error', 'Не удалось сохранить изменения', getFirstApiErrorMessage(payload) || 'Попробуйте еще раз.');
        } finally {
            setEditLoading(false);
        }
    };

    const confirmDeleteAlbum = async () => {
        if (!pendingDeleteAlbum) {
            return;
        }

        setDeleteLoading(true);

        try {
            await api.delete(`/albums/${pendingDeleteAlbum.albumID}`);
            showToast('success', 'Альбом удален', `Запись "${pendingDeleteAlbum.title}" удалена из каталога.`);
            setPendingDeleteAlbum(null);
            await loadData();
        } catch (error) {
            const payload = (error as { response?: { data?: unknown } }).response?.data;
            showToast('error', 'Не удалось удалить альбом', getFirstApiErrorMessage(payload) || 'Возможно, альбом уже участвует в оформленных заказах.');
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleImportFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        try {
            const text = await file.text();
            const parsedRows = parseAlbumImportText(text, file.name);
            const parsedErrors = validateParsedImportRows(parsedRows);

            setImportFileName(file.name);
            setImportRows(parsedRows);
            setImportValidationErrors(parsedErrors);
            setImportResult(null);

            if (parsedErrors.length > 0) {
                showToast('error', 'Файл прочитан с ошибками', `Найдены проблемы в ${parsedErrors.length} полях. Исправьте файл и загрузите его снова.`);
            } else {
                showToast('success', 'Файл загружен', `Подготовлено ${parsedRows.length} строк для импорта.`);
            }
        } catch (error) {
            setImportFileName('');
            setImportRows([]);
            setImportValidationErrors([]);
            setImportResult(null);
            showToast('error', 'Не удалось прочитать файл', (error as Error).message);
        } finally {
            event.target.value = '';
        }
    };

    const handleImportAlbums = async () => {
        if (importRows.length === 0) {
            showToast('error', 'Нет данных для импорта', 'Сначала загрузите CSV или JSON файл.');
            return;
        }

        if (importValidationErrors.length > 0) {
            showToast('error', 'Импорт остановлен', 'Сначала исправьте ошибки в данных файла.');
            return;
        }

        setImportLoading(true);

        try {
            const response = await api.post<ImportResult>('/albums/import', {
                ...importOptions,
                items: mapParsedRowsToImportPayload(importRows),
            });

            setImportResult(response.data);
            await loadData();
            showToast(
                'success',
                'Импорт завершен',
                `Создано: ${response.data.created}, обновлено: ${response.data.updated}, с ошибками: ${response.data.failed}.`,
            );
        } catch (error) {
            const payload = (error as { response?: { data?: ImportResult | { message?: string } } }).response?.data;

            if (payload && typeof payload === 'object' && 'received' in payload) {
                const importPayload = payload as ImportResult;
                setImportResult(importPayload);
                if (importPayload.created > 0 || importPayload.updated > 0) {
                    await loadData();
                }
                showToast('error', 'Импорт завершился с ошибками', `Создано: ${importPayload.created}, обновлено: ${importPayload.updated}, ошибок: ${importPayload.failed}.`);
            } else {
                showToast('error', 'Импорт не выполнен', getFirstApiErrorMessage(payload) || 'Проверьте формат файла и попробуйте еще раз.');
            }
        } finally {
            setImportLoading(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <main className="mx-auto max-w-3xl px-5 py-20 text-center">
                <div className="bg-[var(--paper-soft)] p-8 poster-border">
                    <Shield className="mx-auto h-16 w-16 text-[var(--coral)]" />
                    <h1 className="display-font mt-6 text-6xl leading-none">Нужен вход в аккаунт</h1>
                    <p className="mx-auto mt-5 max-w-xl text-lg leading-7 text-[var(--muted)]">
                        Войдите под учетной записью администратора, чтобы управлять каталогом и импортировать данные.
                    </p>
                </div>
            </main>
        );
    }

    if (role !== 'Admin') {
        return (
            <main className="mx-auto max-w-3xl px-5 py-20 text-center">
                <div className="bg-[var(--paper-soft)] p-8 poster-border">
                    <Shield className="mx-auto h-16 w-16 text-[var(--coral)]" />
                    <h1 className="display-font mt-6 text-6xl leading-none">Доступ закрыт</h1>
                    <p className="mx-auto mt-5 max-w-xl text-lg leading-7 text-[var(--muted)]">
                        Эта страница доступна только пользователям с ролью администратора.
                    </p>
                </div>
            </main>
        );
    }

    return (
        <main className="mx-auto max-w-7xl px-5 py-12 md:px-8">
            <div className="mb-10 flex flex-col gap-6 border-b-2 border-[var(--line)] pb-8 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <div className="text-xs font-black uppercase tracking-[0.22em] text-[var(--coral)]">Управление магазином</div>
                    <h1 className="display-font mt-2 text-6xl leading-none md:text-9xl">Админ-панель</h1>
                    <p className="mt-5 max-w-2xl text-lg leading-7 text-[var(--muted)]">
                        Здесь можно управлять заказами, добавлять и редактировать пластинки, а также загружать данные из CSV или JSON.
                    </p>
                </div>

                <div className="grid grid-cols-3 gap-3 sm:min-w-[360px]">
                    <div className="border-2 border-[var(--line)] bg-[var(--paper-soft)] p-4 text-center">
                        <div className="display-font text-5xl leading-none">{albums.length}</div>
                        <div className="mt-2 text-xs font-black uppercase tracking-[0.18em] text-[var(--muted)]">Альбомов</div>
                    </div>
                    <div className="border-2 border-[var(--line)] bg-[var(--paper-soft)] p-4 text-center">
                        <div className="display-font text-5xl leading-none">{artists.length}</div>
                        <div className="mt-2 text-xs font-black uppercase tracking-[0.18em] text-[var(--muted)]">Артистов</div>
                    </div>
                    <div className="border-2 border-[var(--line)] bg-[var(--paper-soft)] p-4 text-center">
                        <div className="display-font text-5xl leading-none">{genres.length}</div>
                        <div className="mt-2 text-xs font-black uppercase tracking-[0.18em] text-[var(--muted)]">Жанров</div>
                    </div>
                </div>
            </div>

            <div className="mb-8 flex flex-wrap gap-3">
                <button
                    onClick={() => setActiveTab('orders')}
                    className={`border-2 border-[var(--line)] px-5 py-3 font-black uppercase tracking-[0.14em] flex items-center gap-2 transition-colors ${
                        activeTab === 'orders' ? 'bg-[var(--ink)] text-white' : 'bg-[var(--paper-soft)] hover:bg-gray-100'
                    }`}
                >
                    <Package size={18} /> Заказы
                </button>
                <button
                    onClick={() => setActiveTab('catalog')}
                    className={`border-2 border-[var(--line)] px-5 py-3 font-black uppercase tracking-[0.14em] transition-colors ${
                        activeTab === 'catalog' ? 'bg-[var(--ink)] text-white' : 'bg-[var(--paper-soft)] hover:bg-gray-100'
                    }`}
                >
                    Каталог
                </button>
                <button
                    onClick={() => setActiveTab('import')}
                    className={`border-2 border-[var(--line)] px-5 py-3 font-black uppercase tracking-[0.14em] transition-colors ${
                        activeTab === 'import' ? 'bg-[var(--ink)] text-white' : 'bg-[var(--paper-soft)] hover:bg-gray-100'
                    }`}
                >
                    Импорт данных
                </button>
                <button
                    onClick={() => {
                        if (activeTab === 'orders') void fetchOrders();
                        else void loadData();
                    }}
                    className="inline-flex items-center gap-2 border-2 border-[var(--line)] bg-[var(--sun)] px-5 py-3 font-black uppercase tracking-[0.14em] hover:bg-[#e5b32e] transition-colors ml-auto"
                >
                    <RefreshCcw className="h-4 w-4" /> Обновить
                </button>
            </div>

            {/* ВКЛАДКА: ЗАКАЗЫ */}
            {activeTab === 'orders' ? (
                <section className="border-2 border-[var(--line)] bg-[var(--paper-soft)] p-6 poster-border-sm md:p-8">
                    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <h2 className="display-font text-4xl leading-none">Список заказов</h2>
                            <p className="mt-2 text-[var(--muted)]">Управляйте статусами доставок. Завершенные заказы блокируются от изменений.</p>
                        </div>
                    </div>

                    {ordersLoading ? (
                        <div className="py-10 text-center font-bold">Загрузка заказов...</div>
                    ) : (
                        <div className="overflow-hidden border-2 border-[var(--line)] bg-white">
                            <div className="hidden grid-cols-[80px_1fr_1.5fr_1fr_1.2fr] border-b-2 border-[var(--line)] bg-[var(--paper-soft)] px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-[var(--muted)] md:grid">
                                <span>ID</span>
                                <span>Дата</span>
                                <span>Клиент</span>
                                <span>Сумма</span>
                                <span>Статус</span>
                            </div>

                            {orders.length > 0 ? orders.map(order => {
                                const isLocked = order.status === 'Completed' || order.status === 'Cancelled';
                                return (
                                    <div key={order.orderID} className="grid gap-3 border-b border-[var(--line)] px-4 py-4 md:grid-cols-[80px_1fr_1.5fr_1fr_1.2fr] md:items-center">
                                        <div className="font-black text-lg">#{order.orderID}</div>
                                        <div className="text-sm font-semibold text-[var(--muted)]">{new Date(order.orderDate).toLocaleDateString('ru-RU')}</div>
                                        <div>
                                            <div className="font-bold">{order.customerName}</div>
                                            <div className="text-sm text-[var(--muted)] mt-1">{order.customerPhone}</div>
                                        </div>
                                        <div className="font-black tabular-nums">{formatPrice(order.totalAmount)} ₽</div>
                                        <div>
                                            <select
                                                value={order.status}
                                                onChange={(e) => void handleStatusChange(order.orderID, e.target.value)}
                                                disabled={isLocked}
                                                className={`w-full border-2 px-3 py-3 font-bold outline-none cursor-pointer transition-colors ${
                                                    isLocked
                                                        ? 'border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed'
                                                        : 'border-[var(--line)] bg-white hover:bg-gray-50 focus:border-[var(--coral)]'
                                                }`}
                                            >
                                                <option value="Pending">В ожидании</option>
                                                <option value="Processing">В сборке</option>
                                                <option value="Shipped">В пути</option>
                                                <option value="Completed">Выполнен</option>
                                                <option value="Cancelled">Отменен</option>
                                            </select>
                                            {isLocked && <div className="mt-2 flex items-center gap-1 text-xs font-semibold text-red-600"><AlertCircle size={14}/> Заблокировано</div>}
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div className="px-4 py-12 text-center font-semibold text-[var(--muted)] bg-white">
                                    Заказов пока нет.
                                </div>
                            )}
                        </div>
                    )}
                </section>
            ) : loading ? (
                // СОСТОЯНИЕ ЗАГРУЗКИ (Для Каталога и Импорта)
                <div className="border-2 border-[var(--line)] bg-[var(--paper-soft)] p-8 font-bold">
                    Загружаем данные каталога...
                </div>
            ) : activeTab === 'catalog' ? (
                // ВКЛАДКА: КАТАЛОГ
                <div className="space-y-10">
                    <section className="border-2 border-[var(--line)] bg-[var(--paper-soft)] p-6 poster-border-sm md:p-8">
                        <div className="mb-6 flex items-center gap-3">
                            <Plus className="h-7 w-7 text-[var(--coral)]" />
                            <div>
                                <h2 className="display-font text-4xl leading-none">Новый альбом</h2>
                                <p className="mt-2 text-[var(--muted)]">Форма с валидацией до запроса в API и с обработкой серверных ошибок.</p>
                            </div>
                        </div>

                        <AlbumFormFields
                            form={createForm}
                            errors={createErrors}
                            artists={artists}
                            genres={genres}
                            onChange={updateCreateField}
                            onSubmit={handleCreateAlbum}
                            submitText="Добавить альбом"
                            loading={createLoading}
                        />
                    </section>

                    <section className="border-2 border-[var(--line)] bg-[var(--paper-soft)] p-6 poster-border-sm md:p-8">
                        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <h2 className="display-font text-4xl leading-none">Текущий каталог</h2>
                                <p className="mt-2 text-[var(--muted)]">Быстрый поиск и операции редактирования без перезагрузки страницы.</p>
                            </div>
                            <label className="relative block lg:w-[360px]">
                                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--muted)]" />
                                <input
                                    value={search}
                                    onChange={event => setSearch(event.target.value)}
                                    placeholder="Поиск по альбому, артисту или жанру"
                                    className="w-full border-2 border-[var(--line)] bg-white py-4 pl-12 pr-4 font-bold outline-none focus:bg-[var(--sun)]/20"
                                />
                            </label>
                        </div>

                        <div className="overflow-hidden border-2 border-[var(--line)] bg-white">
                            <div className="hidden grid-cols-[2.4fr_1.4fr_1fr_0.8fr_1fr_0.9fr_120px] border-b-2 border-[var(--line)] bg-[var(--paper-soft)] px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-[var(--muted)] md:grid">
                                <span>Альбом</span>
                                <span>Артист</span>
                                <span>Жанр</span>
                                <span>Год</span>
                                <span>Цена</span>
                                <span>Остаток</span>
                                <span className="text-right">Действия</span>
                            </div>

                            {filteredAlbums.length > 0 ? filteredAlbums.map(album => (
                                <div key={album.albumID} className="grid gap-3 border-b border-[var(--line)] px-4 py-4 md:grid-cols-[2.4fr_1.4fr_1fr_0.8fr_1fr_0.9fr_120px] md:items-center hover:bg-gray-50 transition-colors">
                                    <div>
                                        <div className="font-black">{album.title}</div>
                                        <div className="mt-1 text-sm text-[var(--muted)] line-clamp-2">{album.description || 'Без описания'}</div>
                                    </div>
                                    <div className="text-sm font-semibold">{album.artist?.name || 'Не указан'}</div>
                                    <div className="text-sm font-semibold">{album.genre?.name || 'Не указан'}</div>
                                    <div className="text-sm font-semibold">{album.releaseYear || '—'}</div>
                                    <div className="font-black tabular-nums">{album.price.toLocaleString('ru-RU')} ₽</div>
                                    <div className={`text-sm font-bold ${album.stockQuantity === 0 ? 'text-red-600' : 'text-green-700'}`}>{album.stockQuantity} шт.</div>
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => openEditModal(album)} className="grid h-11 w-11 place-items-center border-2 border-[var(--line)] bg-[var(--sun)] hover:bg-[#e5b32e] transition-colors" title="Редактировать">
                                            <Edit className="h-4 w-4" />
                                        </button>
                                        <button onClick={() => setPendingDeleteAlbum(album)} className="grid h-11 w-11 place-items-center border-2 border-[var(--line)] bg-red-100 text-red-700 hover:bg-red-200 transition-colors" title="Удалить">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            )) : (
                                <div className="px-4 py-8 text-center font-semibold text-[var(--muted)]">
                                    По текущему фильтру ничего не найдено.
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            ) : (
                // ВКЛАДКА: ИМПОРТ ДАННЫХ
                <div className="space-y-8">
                    <section className="border-2 border-[var(--line)] bg-[var(--paper-soft)] p-6 poster-border-sm md:p-8">
                        <div className="mb-6 flex items-center gap-3">
                            <Upload className="h-7 w-7 text-[var(--coral)]" />
                            <div>
                                <h2 className="display-font text-4xl leading-none">Импорт из файла</h2>
                                <p className="mt-2 text-[var(--muted)]">Поддерживаются `CSV` и `JSON` с колонками `title`, `artistName`, `genreName`, `releaseYear`, `price`, `stockQuantity`, `description`, `imageURL`.</p>
                            </div>
                        </div>

                        <div className="grid gap-8 lg:grid-cols-[1.3fr_0.9fr]">
                            <div className="space-y-5">
                                <label className="flex cursor-pointer items-center justify-center border-2 border-dashed border-[var(--line)] bg-white px-6 py-10 text-center hover:bg-gray-50 transition-colors">
                                    <div>
                                        <FileText className="mx-auto h-10 w-10 text-[var(--coral)]" />
                                        <div className="mt-4 font-black uppercase tracking-[0.14em]">Выбрать CSV или JSON файл</div>
                                        <div className="mt-2 text-sm text-[var(--muted)]">Можно повторно загружать файл после правок.</div>
                                        {importFileName && <div className="mt-4 text-sm font-bold text-[var(--blue)] bg-blue-50 py-2 border-2 border-blue-200">{importFileName}</div>}
                                    </div>
                                    <input type="file" accept=".csv,.json,application/json,text/csv" className="hidden" onChange={event => void handleImportFileChange(event)} />
                                </label>

                                <div className="grid gap-3 md:grid-cols-3">
                                    <label className="flex items-start gap-3 border-2 border-[var(--line)] bg-white p-4 font-semibold cursor-pointer">
                                        <input type="checkbox" checked={importOptions.updateExisting} onChange={event => setImportOptions(previous => ({ ...previous, updateExisting: event.target.checked }))} className="mt-1 h-4 w-4 accent-[var(--coral)]" />
                                        <span>Обновлять существующие альбомы</span>
                                    </label>
                                    <label className="flex items-start gap-3 border-2 border-[var(--line)] bg-white p-4 font-semibold cursor-pointer">
                                        <input type="checkbox" checked={importOptions.createMissingArtists} onChange={event => setImportOptions(previous => ({ ...previous, createMissingArtists: event.target.checked }))} className="mt-1 h-4 w-4 accent-[var(--coral)]" />
                                        <span>Создавать новых артистов</span>
                                    </label>
                                    <label className="flex items-start gap-3 border-2 border-[var(--line)] bg-white p-4 font-semibold cursor-pointer">
                                        <input type="checkbox" checked={importOptions.createMissingGenres} onChange={event => setImportOptions(previous => ({ ...previous, createMissingGenres: event.target.checked }))} className="mt-1 h-4 w-4 accent-[var(--coral)]" />
                                        <span>Создавать новые жанры</span>
                                    </label>
                                </div>

                                <button onClick={() => void handleImportAlbums()} disabled={importLoading || importRows.length === 0} className="inline-flex items-center gap-3 border-2 border-[var(--line)] bg-[var(--ink)] px-6 py-4 font-black uppercase tracking-[0.14em] text-white disabled:opacity-60 hover:bg-gray-800 transition-colors">
                                    <Upload className="h-5 w-5" />
                                    {importLoading ? 'Импортируем...' : 'Запустить импорт'}
                                </button>
                            </div>

                            <div className="border-2 border-[var(--line)] bg-white p-5">
                                <div className="text-xs font-black uppercase tracking-[0.18em] text-[var(--muted)]">Пример CSV</div>
                                <pre className="mt-4 overflow-auto text-sm leading-6 text-[var(--muted)]">{`title,artistName,genreName,releaseYear,price,stockQuantity,description,imageURL
Rumours,Fleetwood Mac,Rock,1977,3590,8,Classic soft rock album,https://example.com/rumours.jpg`}</pre>

                                <div className="mt-6 text-xs font-black uppercase tracking-[0.18em] text-[var(--muted)]">Пример JSON</div>
                                <pre className="mt-4 overflow-auto text-sm leading-6 text-[var(--muted)]">{`[
  {
    "title": "Kind of Blue",
    "artistName": "Miles Davis",
    "genreName": "Jazz",
    "releaseYear": 1959,
    "price": 3290,
    "stockQuantity": 6
  }
]`}</pre>
                            </div>
                        </div>
                    </section>

                    {importRows.length > 0 && (
                        <section className="border-2 border-[var(--line)] bg-[var(--paper-soft)] p-6 poster-border-sm md:p-8">
                            <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <h3 className="display-font text-4xl leading-none">Предпросмотр</h3>
                                    <p className="mt-2 text-[var(--muted)]">Подготовлено строк: {importRows.length}</p>
                                </div>
                                {importValidationErrors.length > 0 && (
                                    <div className="inline-flex items-center gap-2 border-2 border-red-300 bg-red-100 px-4 py-3 text-sm font-bold text-red-800">
                                        <AlertTriangle className="h-4 w-4" /> Найдено ошибок: {importValidationErrors.length}
                                    </div>
                                )}
                            </div>

                            <div className="overflow-hidden border-2 border-[var(--line)] bg-white">
                                <div className="hidden grid-cols-[80px_2fr_1.4fr_1fr_0.8fr_0.8fr] border-b-2 border-[var(--line)] bg-[var(--paper-soft)] px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-[var(--muted)] md:grid">
                                    <span>Строка</span>
                                    <span>Альбом</span>
                                    <span>Артист</span>
                                    <span>Жанр</span>
                                    <span>Цена</span>
                                    <span>Склад</span>
                                </div>

                                {importRows.slice(0, 8).map(row => (
                                    <div key={row.rowNumber} className="grid gap-3 border-b border-[var(--line)] px-4 py-4 md:grid-cols-[80px_2fr_1.4fr_1fr_0.8fr_0.8fr]">
                                        <span className="font-black">{row.rowNumber}</span>
                                        <span>{row.title || '—'}</span>
                                        <span>{row.artistName || (row.artistID ? `ID ${row.artistID}` : '—')}</span>
                                        <span>{row.genreName || (row.genreID ? `ID ${row.genreID}` : '—')}</span>
                                        <span>{row.price || '—'}</span>
                                        <span>{row.stockQuantity || '—'}</span>
                                    </div>
                                ))}
                            </div>

                            {importValidationErrors.length > 0 && (
                                <div className="mt-6 space-y-3">
                                    <div className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Ошибки файла</div>
                                    <div className="space-y-2">
                                        {importValidationErrors.map((error, index) => (
                                            <div key={`${error.rowNumber}-${index}`} className="border-2 border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
                                                Строка {error.rowNumber}: {error.message}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </section>
                    )}

                    {importResult && (
                        <section className="border-2 border-[var(--line)] bg-[var(--paper-soft)] p-6 poster-border-sm md:p-8">
                            <div className="mb-6 flex flex-wrap gap-3">
                                <div className="border-2 border-[var(--line)] bg-white px-5 py-4">
                                    <div className="display-font text-4xl leading-none">{importResult.received}</div>
                                    <div className="mt-1 text-xs font-black uppercase tracking-[0.16em] text-[var(--muted)]">Получено</div>
                                </div>
                                <div className="border-2 border-[var(--line)] bg-white px-5 py-4">
                                    <div className="display-font text-4xl leading-none">{importResult.created}</div>
                                    <div className="mt-1 text-xs font-black uppercase tracking-[0.16em] text-[var(--muted)]">Создано</div>
                                </div>
                                <div className="border-2 border-[var(--line)] bg-white px-5 py-4">
                                    <div className="display-font text-4xl leading-none">{importResult.updated}</div>
                                    <div className="mt-1 text-xs font-black uppercase tracking-[0.16em] text-[var(--muted)]">Обновлено</div>
                                </div>
                                <div className="border-2 border-[var(--line)] bg-white px-5 py-4">
                                    <div className="display-font text-4xl leading-none">{importResult.failed}</div>
                                    <div className="mt-1 text-xs font-black uppercase tracking-[0.16em] text-[var(--muted)]">Ошибок</div>
                                </div>
                            </div>

                            {importResult.errors.length > 0 ? (
                                <div className="space-y-2">
                                    {importResult.errors.map((error, index) => (
                                        <div key={`${error.rowNumber}-${index}`} className="border-2 border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
                                            Строка {error.rowNumber}{error.title ? ` (${error.title})` : ''}: {error.message}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="font-semibold text-[var(--muted)]">Все строки обработаны без ошибок.</div>
                            )}
                        </section>
                    )}
                </div>
            )}

            {/* МОДАЛЬНОЕ ОКНО РЕДАКТИРОВАНИЯ АЛЬБОМА */}
            {editingAlbum && editForm && (
                <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/45 p-6 backdrop-blur-sm">
                    <div className="max-h-[92vh] w-full max-w-4xl overflow-auto bg-[var(--paper-soft)] p-6 poster-border md:p-8 relative border-2 border-[var(--line)]">
                        <div className="mb-6 flex items-center justify-between gap-4 border-b-2 border-[var(--line)] pb-4">
                            <div>
                                <div className="text-xs font-black uppercase tracking-[0.18em] text-[var(--coral)]">Редактирование</div>
                                <h2 className="display-font mt-2 text-5xl leading-none">Изменить альбом</h2>
                            </div>
                            <button onClick={() => setEditingAlbum(null)} className="border-2 border-[var(--line)] bg-white px-4 py-3 font-black uppercase tracking-[0.12em] hover:bg-gray-100 transition-colors">
                                Закрыть
                            </button>
                        </div>

                        <AlbumFormFields
                            form={editForm}
                            errors={editErrors}
                            artists={artists}
                            genres={genres}
                            onChange={updateEditField}
                            onSubmit={handleUpdateAlbum}
                            submitText="Сохранить изменения"
                            loading={editLoading}
                        />
                    </div>
                </div>
            )}

            {/* ДИАЛОГ УДАЛЕНИЯ АЛЬБОМА */}
            <ConfirmDialog
                open={Boolean(pendingDeleteAlbum)}
                title="Удалить альбом?"
                description={pendingDeleteAlbum ? `Запись "${pendingDeleteAlbum.title}" будет удалена из каталога.` : undefined}
                confirmText="Удалить"
                variant="danger"
                loading={deleteLoading}
                onCancel={() => setPendingDeleteAlbum(null)}
                onConfirm={() => void confirmDeleteAlbum()}
            />

            <Toast {...toast} onClose={() => setToast(previous => ({ ...previous, open: false }))} />
        </main>
    );
}