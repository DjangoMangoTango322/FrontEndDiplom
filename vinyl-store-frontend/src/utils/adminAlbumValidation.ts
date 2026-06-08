import type { Album, Artist, Genre } from '../types';

export type AdminAlbumForm = {
    title: string;
    artistID: number;
    genreID: number;
    releaseYear: string;
    price: string;
    stockQuantity: string;
    description: string;
    imageURL: string;
};

export type AdminAlbumFormErrors = Partial<Record<keyof AdminAlbumForm, string>>;

export const createEmptyAlbumForm = (artistID = 0, genreID = 0): AdminAlbumForm => ({
    title: '',
    artistID,
    genreID,
    releaseYear: String(new Date().getFullYear()),
    price: '2500',
    stockQuantity: '10',
    description: '',
    imageURL: '',
});

export const albumToAdminForm = (album: Album): AdminAlbumForm => ({
    title: album.title,
    artistID: album.artistID,
    genreID: album.genreID,
    releaseYear: album.releaseYear?.toString() ?? '',
    price: album.price.toString(),
    stockQuantity: album.stockQuantity.toString(),
    description: album.description ?? '',
    imageURL: album.imageURL ?? '',
});

export const validateAdminAlbumForm = (
    form: AdminAlbumForm,
    artists: Artist[],
    genres: Genre[],
): AdminAlbumFormErrors => {
    const errors: AdminAlbumFormErrors = {};
    const currentYear = new Date().getFullYear() + 1;

    if (!form.title.trim()) {
        errors.title = 'Введите название альбома.';
    } else if (form.title.trim().length > 200) {
        errors.title = 'Название не должно превышать 200 символов.';
    }

    if (!artists.some(artist => artist.artistID === form.artistID)) {
        errors.artistID = 'Выберите существующего исполнителя.';
    }

    if (!genres.some(genre => genre.genreID === form.genreID)) {
        errors.genreID = 'Выберите существующий жанр.';
    }

    if (form.releaseYear.trim()) {
        const releaseYear = Number(form.releaseYear);
        if (!Number.isInteger(releaseYear) || releaseYear < 1900 || releaseYear > currentYear) {
            errors.releaseYear = `Год выпуска должен быть в диапазоне 1900-${currentYear}.`;
        }
    }

    const price = Number(form.price);
    if (!Number.isFinite(price) || price <= 0 || price > 9_999_999) {
        errors.price = 'Цена должна быть больше 0 и не превышать 9 999 999.';
    }

    const stockQuantity = Number(form.stockQuantity);
    if (!Number.isInteger(stockQuantity) || stockQuantity < 0 || stockQuantity > 100_000) {
        errors.stockQuantity = 'Остаток на складе должен быть в диапазоне 0-100000.';
    }

    if (form.description.trim().length > 2000) {
        errors.description = 'Описание не должно превышать 2000 символов.';
    }

    if (form.imageURL.trim() && !isSupportedImageUrl(form.imageURL)) {
        errors.imageURL = 'Укажите корректный абсолютный URL изображения.';
    }

    return errors;
};

export const buildAlbumPayload = (form: AdminAlbumForm) => ({
    title: form.title.trim(),
    artistID: form.artistID,
    genreID: form.genreID,
    releaseYear: form.releaseYear.trim() ? Number(form.releaseYear) : null,
    price: Number(form.price),
    stockQuantity: Number(form.stockQuantity),
    description: form.description.trim() || null,
    imageURL: form.imageURL.trim() || null,
});

export const isSupportedImageUrl = (value: string) => {
    try {
        const url = new URL(value.trim());
        return ['http:', 'https:', 'data:'].includes(url.protocol);
    } catch {
        return value.trim().startsWith('data:image/');
    }
};
