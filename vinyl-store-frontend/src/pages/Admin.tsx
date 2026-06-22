import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Edit, FileText, Plus, RefreshCcw, Search, Shield, Trash2, Upload, Package, AlertCircle, Eye, X, User, MapPin, CreditCard, Gift as GiftIcon } from 'lucide-react';
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

const formatPrice = (value: number) => value.toLocaleString('ru-RU');

interface Order {
    orderID: number;
    customerName: string;
    customerPhone: string;
    totalAmount: number;
    status: string;
    orderDate: string;
    // Поля для просмотра деталей заказа
    deliveryAddress?: string;
    paymentMethod?: string;
    isGift?: boolean;
    giftRecipientName?: string;
    giftRecipientEmail?: string;
    giftFromName?: string;
    giftMessage?: string;
    items?: Array<{
        album: { title: string };
        quantity: number;
        priceAtPurchase: number;
    }>;
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
    if (!payload || typeof payload !== 'object') return null;
    const data = payload as { message?: string; errors?: Record<string, string[]> };
    if (data.message) return data.message;
    const firstFieldErrors = Object.values(data.errors ?? {}).flat();
    return firstFieldErrors[0] ?? null;
};

const mapApiValidationErrors = (payload: unknown): AdminAlbumFormErrors => {
    if (!payload || typeof payload !== 'object') return {};
    const data = payload as { errors?: Record<string, string[]> };
    if (!data.errors) return {};
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
    onSubmit: (event: React.FormEvent) => void;
    originalStock?: number;
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
                             originalStock
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
                <input
                    type="number"
                    value={form.stockQuantity}
                    onChange={event => onChange('stockQuantity', event.target.value)}
                    className={inputClass}
                />
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

    const [albums, setAlbums] = useState<Album[]>([]);
    const [artists, setArtists] = useState<Artist[]>([]);
    const [genres, setGenres] = useState<Genre[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const [orders, setOrders] = useState<Order[]>([]);
    const [ordersLoading, setOrdersLoading] = useState(false);

    // Стейты для просмотра деталей заказа
    const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
    const [detailsLoading, setDetailsLoading] = useState(false);

    const [createForm, setCreateForm] = useState<AdminAlbumForm>(createEmptyAlbumForm());
    const [createErrors, setCreateErrors] = useState<AdminAlbumFormErrors>({});
    const [createLoading, setCreateLoading] = useState(false);

    const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
    const [editForm, setEditForm] = useState<AdminAlbumForm | null>(null);
    const [editErrors, setEditErrors] = useState<AdminAlbumFormErrors>({});
    const [editLoading, setEditLoading] = useState(false);

    const [pendingDeleteAlbum, setPendingDeleteAlbum] = useState<Album | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

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

    const handleViewOrderDetails = async (orderId: number) => {
        setDetailsLoading(true);
        try {
            const response = await api.get<Order>(`/orders/${orderId}/details`);
            setViewingOrder(response.data);
        } catch (error) {
            showToast('error', 'Ошибка', 'Не удалось загрузить детали заказа');
        } finally {
            setDetailsLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'orders' && orders.length === 0) {
            void fetchOrders();
        }
    }, [activeTab]);

    const handleStatusChange = async (orderId: number, newStatus: string) => {
        try {
            await api.put(`/orders/${orderId}/status`, { status: newStatus });
            setOrders(prev => prev.map(o => o.orderID === orderId ? { ...o, status: newStatus } : o));
            showToast('success', 'Статус обновлен', `Заказ #${orderId} переведен в статус "${newStatus}"`);
        } catch (error) {
            const msg = getFirstApiErrorMessage((error as any).response?.data) || 'Не удалось изменить статус заказа';
            showToast('error', 'Ошибка', msg);
        }
    };

    const fetchAllAlbums = async () => {
        const firstPage = await api.get<CatalogResponse>('/albums', { params: { page: 1, pageSize: 100 } });
        const { data, totalPages } = firstPage.data;
        if (totalPages <= 1) return data;
        const remainingPages = await Promise.all(
            Array.from({ length: totalPages - 1 }, (_, index) =>
                api.get<CatalogResponse>('/albums', { params: { page: index + 2, pageSize: 100 } }))
        );
        return [...data, ...remainingPages.flatMap(response => response.data.data)];
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
        if (!term) return albums;
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
        if (!editForm) return;
        setEditForm(previous => previous ? { ...previous, [field]: value } : previous);
        setEditErrors(previous => {
            const next = { ...previous };
            delete next[field];
            return next;
        });
    };

    const handleCreateAlbum = async (event: React.FormEvent) => {
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
            if (hasFormErrors(apiErrors)) setCreateErrors(apiErrors);
            showToast('error', 'Не удалось создать альбом', getFirstApiErrorMessage(payload) || 'Попробуйте еще раз.');
        } finally {
            setCreateLoading(false);
        }
    };

    const openEditModal = (album: Album) => {
        setEditingAlbum(album);
        const form = albumToAdminForm(album);
        form.stockQuantity = '0';
        setEditForm(form);
        setEditErrors({});
    };

    const handleUpdateAlbum = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!editingAlbum || !editForm) return;

        const addedAmount = Number(editForm.stockQuantity) || 0;
        const finalStockQuantity = editingAlbum.stockQuantity + addedAmount;

        const formToValidate = {
            ...editForm,
            stockQuantity: finalStockQuantity.toString()
        };

        const validationErrors = validateAdminAlbumForm(formToValidate, artists, genres);
        setEditErrors(validationErrors);

        if (hasFormErrors(validationErrors)) {
            showToast('error', 'Ошибка остатков', 'Итоговый остаток на складе не может быть меньше 0.');
            return;
        }

        setEditLoading(true);
        try {
            await api.put(`/albums/${editingAlbum.albumID}`, buildAlbumPayload(formToValidate));
            showToast('success', 'Изменения сохранены', 'Карточка альбома и остатки обновлены.');
            setEditingAlbum(null);
            setEditForm(null);
            await loadData();
        } catch (error) {
            const payload = (error as { response?: { data?: unknown } }).response?.data;
            const apiErrors = mapApiValidationErrors(payload);
            if (hasFormErrors(apiErrors)) setEditErrors(apiErrors);
            showToast('error', 'Не удалось сохранить изменения', getFirstApiErrorMessage(payload) || 'Попробуйте еще раз.');
        } finally {
            setEditLoading(false);
        }
    };

    const confirmDeleteAlbum = async () => {
        if (!pendingDeleteAlbum) return;
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

    const handleImportFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

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
                if (importPayload.created > 0 || importPayload.updated > 0) await loadData();
                showToast('error', 'Импорт завершился с ошибками', `Создано: ${importPayload.created}, обновлено: ${importPayload.updated}, ошибок: ${importPayload.failed}.`);
            } else {
                showToast('error', 'Импорт не выполнен', getFirstApiErrorMessage(payload) || 'Проверьте формат файла и попробуйте еще раз.');
            }
        } finally {
            setImportLoading(false);
        }
    };

    if (!isAuthenticated || role !== 'Admin') {
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
                <div className="min-w-0 overflow-hidden">
                    <div className="text-xs font-black uppercase tracking-[0.22em] text-[var(--coral)]">Управление магазином</div>
                    <h1 className="display-font mt-2 text-5xl sm:text-6xl md:text-7xl lg:text-8xl whitespace-nowrap">Админ-панель</h1>
                    <p className="mt-5 max-w-2xl text-base md:text-lg leading-7 text-[var(--muted)] truncate whitespace-normal">
                        Здесь можно управлять заказами, добавлять и редактировать пластинки, а также загружать данные из CSV или JSON.
                    </p>
                </div>

                <div className="grid grid-cols-3 gap-3 w-full lg:w-auto lg:min-w-[360px]">
                    <div className="border-2 border-[var(--line)] bg-[var(--paper-soft)] p-4 text-center">
                        <div className="display-font text-4xl sm:text-5xl leading-none">{albums.length}</div>
                        <div className="mt-2 text-[10px] sm:text-xs font-black uppercase tracking-[0.18em] text-[var(--muted)]">Альбомов</div>
                    </div>
                    <div className="border-2 border-[var(--line)] bg-[var(--paper-soft)] p-4 text-center">
                        <div className="display-font text-4xl sm:text-5xl leading-none">{artists.length}</div>
                        <div className="mt-2 text-[10px] sm:text-xs font-black uppercase tracking-[0.18em] text-[var(--muted)]">Артистов</div>
                    </div>
                    <div className="border-2 border-[var(--line)] bg-[var(--paper-soft)] p-4 text-center">
                        <div className="display-font text-4xl sm:text-5xl leading-none">{genres.length}</div>
                        <div className="mt-2 text-[10px] sm:text-xs font-black uppercase tracking-[0.18em] text-[var(--muted)]">Жанров</div>
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
                <section className="border-2 border-[var(--line)] bg-[var(--paper-soft)] p-4 sm:p-6 poster-border-sm md:p-8">
                    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <h2 className="display-font text-4xl leading-none">Список заказов</h2>
                            <p className="mt-2 text-[var(--muted)]">Управляйте статусами доставок. Завершенные заказы блокируются от изменений.</p>
                        </div>
                    </div>

                    {ordersLoading ? (
                        <div className="py-10 text-center font-bold">Загрузка заказов...</div>
                    ) : (
                        <div className="overflow-x-auto border-2 border-[var(--line)] bg-white">
                            <div className="min-w-[850px]">
                                {/* ДОБАВЛЕНА КОЛОНКА "ИНФО" */}
                                <div className="grid grid-cols-[80px_1fr_1.5fr_1fr_1.2fr_60px] border-b-2 border-[var(--line)] bg-[var(--paper-soft)] px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-[var(--muted)]">
                                    <span>ID</span>
                                    <span>Дата</span>
                                    <span>Клиент</span>
                                    <span>Сумма</span>
                                    <span>Статус</span>
                                    <span className="text-center">Инфо</span>
                                </div>

                                {orders.length > 0 ? orders.map(order => {
                                    const isLocked = order.status === 'Completed' || order.status === 'Cancelled';
                                    return (
                                        <div key={order.orderID} className="grid gap-3 border-b border-[var(--line)] px-4 py-4 grid-cols-[80px_1fr_1.5fr_1fr_1.2fr_60px] items-center hover:bg-gray-50 transition-colors">
                                            <div className="font-black text-lg truncate">#{order.orderID}</div>
                                            <div className="text-sm font-semibold text-[var(--muted)] truncate">{new Date(order.orderDate).toLocaleDateString('ru-RU')}</div>
                                            <div className="min-w-0">
                                                <div className="font-bold truncate">{order.customerName}</div>
                                                <div className="text-sm text-[var(--muted)] mt-1 truncate">{order.customerPhone}</div>
                                            </div>
                                            <div className="font-black tabular-nums truncate">{formatPrice(order.totalAmount)} ₽</div>
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
                                                {isLocked && <div className="mt-2 flex items-center gap-1 text-[10px] sm:text-xs font-semibold text-red-600 truncate"><AlertCircle size={14}/> Заблокировано</div>}
                                            </div>
                                            {/* ДОБАВЛЕНА КНОПКА ГЛАЗА */}
                                            <div className="flex justify-center">
                                                <button
                                                    onClick={() => void handleViewOrderDetails(order.orderID)}
                                                    className="grid h-10 w-10 place-items-center bg-[var(--paper-soft)] border-2 border-[var(--line)] hover:bg-[var(--sun)] transition-colors"
                                                    title="Посмотреть детали заказа"
                                                >
                                                    {detailsLoading && viewingOrder?.orderID === order.orderID ? <RefreshCcw size={18} className="animate-spin" /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                }) : (
                                    <div className="px-4 py-12 text-center font-semibold text-[var(--muted)] bg-white">
                                        Заказов пока нет.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </section>
            ) : loading ? (
                <div className="border-2 border-[var(--line)] bg-[var(--paper-soft)] p-8 font-bold">
                    Загружаем данные каталога...
                </div>
            ) : activeTab === 'catalog' ? (
                // ВКЛАДКА: КАТАЛОГ
                <div className="space-y-10">
                    <section className="border-2 border-[var(--line)] bg-[var(--paper-soft)] p-4 sm:p-6 poster-border-sm md:p-8">
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

                    <section className="border-2 border-[var(--line)] bg-[var(--paper-soft)] p-4 sm:p-6 poster-border-sm md:p-8">
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

                        <div className="overflow-x-auto border-2 border-[var(--line)] bg-white">
                            <div className="min-w-[900px]">
                                <div className="grid grid-cols-[2fr_1.2fr_1fr_80px_100px_100px_100px] border-b-2 border-[var(--line)] bg-[var(--paper-soft)] px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-[var(--muted)]">
                                    <span>Альбом</span>
                                    <span>Артист</span>
                                    <span>Жанр</span>
                                    <span>Год</span>
                                    <span>Цена</span>
                                    <span>Склад</span>
                                    <span className="text-right">Действия</span>
                                </div>

                                {filteredAlbums.length > 0 ? filteredAlbums.map(album => (
                                    <div key={album.albumID} className="grid gap-3 border-b border-[var(--line)] px-4 py-4 grid-cols-[2fr_1.2fr_1fr_80px_100px_100px_100px] items-center hover:bg-gray-50 transition-colors">
                                        <div className="min-w-0 pr-2">
                                            <div className="font-black truncate" title={album.title}>{album.title}</div>
                                            <div className="mt-1 text-xs text-[var(--muted)] truncate" title={album.description}>{album.description || 'Без описания'}</div>
                                        </div>
                                        <div className="text-sm font-semibold truncate" title={album.artist?.name}>{album.artist?.name || 'Не указан'}</div>
                                        <div className="text-sm font-semibold truncate" title={album.genre?.name}>{album.genre?.name || 'Не указан'}</div>
                                        <div className="text-sm font-semibold">{album.releaseYear || '—'}</div>
                                        <div className="font-black tabular-nums">{album.price.toLocaleString('ru-RU')} ₽</div>

                                        <div>
                                            <div className={`text-sm font-bold ${album.stockQuantity === 0 ? 'text-red-600' : 'text-green-700'}`}>
                                                {album.stockQuantity} шт.
                                            </div>
                                        </div>

                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => openEditModal(album)} className="grid h-10 w-10 place-items-center border-2 border-[var(--line)] bg-[var(--paper-soft)] hover:bg-gray-100 transition-colors" title="Полное редактирование">
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            <button onClick={() => setPendingDeleteAlbum(album)} className="grid h-10 w-10 place-items-center border-2 border-[var(--line)] bg-red-100 text-red-700 hover:bg-red-200 transition-colors" title="Удалить">
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
                        </div>
                    </section>
                </div>
            ) : (
                // ВКЛАДКА: ИМПОРТ ДАННЫХ
                <div className="space-y-8">
                    <section className="border-2 border-[var(--line)] bg-[var(--paper-soft)] p-4 sm:p-6 poster-border-sm md:p-8">
                        <div className="mb-6 flex items-center gap-3">
                            <Upload className="h-7 w-7 text-[var(--coral)]" />
                            <div>
                                <h2 className="display-font text-4xl leading-none">Импорт из файла</h2>
                                <p className="mt-2 text-[var(--muted)]">Поддерживаются `CSV` и `JSON`.</p>
                            </div>
                        </div>

                        <div className="grid gap-8 lg:grid-cols-[1.3fr_0.9fr]">
                            <div className="space-y-5">
                                <label className="flex cursor-pointer items-center justify-center border-2 border-dashed border-[var(--line)] bg-white px-6 py-10 text-center hover:bg-gray-50 transition-colors">
                                    <div>
                                        <FileText className="mx-auto h-10 w-10 text-[var(--coral)]" />
                                        <div className="mt-4 font-black uppercase tracking-[0.14em]">Выбрать CSV или JSON файл</div>
                                        <div className="mt-2 text-sm text-[var(--muted)]">Можно повторно загружать файл после правок.</div>
                                        {importFileName && <div className="mt-4 text-sm font-bold text-[var(--blue)] bg-blue-50 py-2 border-2 border-blue-200 truncate">{importFileName}</div>}
                                    </div>
                                    <input type="file" accept=".csv,.json,application/json,text/csv" className="hidden" onChange={event => void handleImportFileChange(event)} />
                                </label>

                                <div className="grid gap-3 md:grid-cols-3">
                                    <label className="flex items-start gap-3 border-2 border-[var(--line)] bg-white p-4 font-semibold cursor-pointer">
                                        <input type="checkbox" checked={importOptions.updateExisting} onChange={event => setImportOptions(previous => ({ ...previous, updateExisting: event.target.checked }))} className="mt-1 h-4 w-4 accent-[var(--coral)] flex-shrink-0" />
                                        <span className="text-sm">Обновлять существующие</span>
                                    </label>
                                    <label className="flex items-start gap-3 border-2 border-[var(--line)] bg-white p-4 font-semibold cursor-pointer">
                                        <input type="checkbox" checked={importOptions.createMissingArtists} onChange={event => setImportOptions(previous => ({ ...previous, createMissingArtists: event.target.checked }))} className="mt-1 h-4 w-4 accent-[var(--coral)] flex-shrink-0" />
                                        <span className="text-sm">Создавать новых артистов</span>
                                    </label>
                                    <label className="flex items-start gap-3 border-2 border-[var(--line)] bg-white p-4 font-semibold cursor-pointer">
                                        <input type="checkbox" checked={importOptions.createMissingGenres} onChange={event => setImportOptions(previous => ({ ...previous, createMissingGenres: event.target.checked }))} className="mt-1 h-4 w-4 accent-[var(--coral)] flex-shrink-0" />
                                        <span className="text-sm">Создавать новые жанры</span>
                                    </label>
                                </div>

                                <button onClick={() => void handleImportAlbums()} disabled={importLoading || importRows.length === 0} className="inline-flex w-full sm:w-auto justify-center items-center gap-3 border-2 border-[var(--line)] bg-[var(--ink)] px-6 py-4 font-black uppercase tracking-[0.14em] text-white disabled:opacity-60 hover:bg-gray-800 transition-colors">
                                    <Upload className="h-5 w-5" />
                                    {importLoading ? 'Импортируем...' : 'Запустить импорт'}
                                </button>
                            </div>

                            <div className="border-2 border-[var(--line)] bg-white p-5 overflow-x-auto">
                                <div className="text-xs font-black uppercase tracking-[0.18em] text-[var(--muted)]">Пример CSV</div>
                                <pre className="mt-4 text-sm leading-6 text-[var(--muted)]">{`title,artistName,genreName...`}</pre>
                            </div>
                        </div>
                    </section>

                    {importRows.length > 0 && (
                        <section className="border-2 border-[var(--line)] bg-[var(--paper-soft)] p-4 sm:p-6 poster-border-sm md:p-8">
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

                            <div className="overflow-x-auto border-2 border-[var(--line)] bg-white">
                                <div className="min-w-[900px]">
                                    <div className="grid grid-cols-[80px_2fr_1.4fr_1fr_0.8fr_0.8fr] border-b-2 border-[var(--line)] bg-[var(--paper-soft)] px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-[var(--muted)]">
                                        <span>Строка</span>
                                        <span>Альбом</span>
                                        <span>Артист</span>
                                        <span>Жанр</span>
                                        <span>Цена</span>
                                        <span>Склад</span>
                                    </div>

                                    {importRows.slice(0, 8).map(row => (
                                        <div key={row.rowNumber} className="grid gap-3 border-b border-[var(--line)] px-4 py-4 grid-cols-[80px_2fr_1.4fr_1fr_0.8fr_0.8fr] items-center">
                                            <span className="font-black">{row.rowNumber}</span>
                                            <span className="truncate" title={row.title}>{row.title || '—'}</span>
                                            <span className="truncate">{row.artistName || (row.artistID ? `ID ${row.artistID}` : '—')}</span>
                                            <span className="truncate">{row.genreName || (row.genreID ? `ID ${row.genreID}` : '—')}</span>
                                            <span>{row.price || '—'}</span>
                                            <span>{row.stockQuantity || '—'}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>
                    )}

                    {importResult && (
                        <section className="border-2 border-[var(--line)] bg-[var(--paper-soft)] p-4 sm:p-6 poster-border-sm md:p-8 mt-8">
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

            {/* ДОБАВЛЕНО: МОДАЛЬНОЕ ОКНО ПРОСМОТРА ИНФОРМАЦИИ О ЗАКАЗЕ */}
            {viewingOrder && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
                    <div className="w-full max-w-2xl bg-[var(--paper-soft)] border-4 border-[var(--ink)] shadow-[12px_12px_0px_0px_var(--ink)] overflow-hidden relative">
                        {/* Шапка модалки */}
                        <div className="bg-[var(--ink)] text-white p-5 flex justify-between items-center">
                            <div>
                                <h3 className="display-font text-3xl">Заказ #{viewingOrder.orderID}</h3>
                                <p className="text-xs font-bold opacity-70 uppercase tracking-widest">
                                    от {new Date(viewingOrder.orderDate).toLocaleString('ru-RU')}
                                </p>
                            </div>
                            <button onClick={() => setViewingOrder(null)} className="hover:rotate-90 transition-transform">
                                <X size={32} />
                            </button>
                        </div>

                        {/* Контент модалки */}
                        <div className="p-6 md:p-8 space-y-8 max-h-[75vh] overflow-y-auto">
                            {/* Блок клиента */}
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-[var(--coral)] font-black uppercase text-xs">
                                        <User size={16} /> Покупатель
                                    </div>
                                    <p className="font-black text-xl leading-tight">{viewingOrder.customerName}</p>
                                    <p className="font-bold text-[var(--muted)]">{viewingOrder.customerPhone}</p>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-[var(--coral)] font-black uppercase text-xs">
                                        <MapPin size={16} /> Адрес доставки
                                    </div>
                                    <p className="font-bold leading-relaxed">{viewingOrder.deliveryAddress || 'Не указан'}</p>
                                </div>
                            </div>

                            {/* Способ оплаты и статус */}
                            <div className="flex flex-wrap gap-8 border-y-2 border-[var(--line)] py-5">
                                <div>
                                    <div className="text-[var(--muted)] font-black uppercase text-[10px] mb-1">Оплата</div>
                                    <div className="flex items-center gap-2 font-bold">
                                        <CreditCard size={16} /> {viewingOrder.paymentMethod === 'card' ? 'Карта онлайн' : 'Наличные/СБП'}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[var(--muted)] font-black uppercase text-[10px] mb-1">Текущий статус</div>
                                    <span className="bg-[var(--sun)] px-3 py-1 font-black text-sm border-2 border-[var(--line)]">
                                        {viewingOrder.status}
                                    </span>
                                </div>
                            </div>

                            {/* Блок подарка */}
                            {viewingOrder.isGift && (
                                <div className="bg-white border-2 border-[var(--coral)] p-5 relative overflow-hidden">
                                    <div className="absolute -right-2 -top-2 opacity-10 rotate-12">
                                        <GiftIcon size={80} />
                                    </div>
                                    <div className="flex items-center gap-2 text-[var(--coral)] font-black uppercase text-xs mb-3">
                                        <GiftIcon size={16} /> Это подарок!
                                    </div>
                                    <div className="space-y-2 relative z-10">
                                        <p className="text-sm"><strong>Кому:</strong> {viewingOrder.giftRecipientName} ({viewingOrder.giftRecipientEmail})</p>
                                        <p className="text-sm"><strong>От кого:</strong> {viewingOrder.giftFromName}</p>
                                        <div className="mt-3 p-3 bg-red-50 border-l-4 border-[var(--coral)] italic text-sm">
                                            "{viewingOrder.giftMessage}"
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Состав заказа */}
                            <div className="space-y-4">
                                <div className="text-[var(--muted)] font-black uppercase text-[10px]">Состав заказа</div>
                                <div className="space-y-3">
                                    {viewingOrder.items?.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center border-b border-dashed border-[var(--line)] pb-2">
                                            <div>
                                                <p className="font-black text-lg">{item.album.title}</p>
                                                <p className="text-xs font-bold text-[var(--muted)]">Количество: {item.quantity} шт.</p>
                                            </div>
                                            <p className="font-black">{formatPrice(item.priceAtPurchase * item.quantity)} ₽</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-between pt-4 border-t-2 border-[var(--ink)]">
                                    <span className="font-black uppercase">Итоговая сумма</span>
                                    <span className="display-font text-3xl text-[var(--coral)]">{formatPrice(viewingOrder.totalAmount)} ₽</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* МОДАЛЬНОЕ ОКНО РЕДАКТИРОВАНИЯ АЛЬБОМА */}
            {editingAlbum && editForm && (
                <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/45 p-4 sm:p-6 backdrop-blur-sm">
                    <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto bg-[var(--paper-soft)] p-5 sm:p-6 poster-border md:p-8 relative border-2 border-[var(--line)]">
                        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b-2 border-[var(--line)] pb-4">
                            <div>
                                <div className="text-xs font-black uppercase tracking-[0.18em] text-[var(--coral)]">Редактирование</div>
                                <h2 className="display-font mt-2 text-4xl sm:text-5xl leading-none">Изменить альбом</h2>
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
                            originalStock={editingAlbum.stockQuantity}
                        />
                    </div>
                </div>
            )}

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