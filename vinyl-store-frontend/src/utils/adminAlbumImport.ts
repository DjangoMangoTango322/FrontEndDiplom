import { isSupportedImageUrl } from './adminAlbumValidation';

export type ParsedAlbumImportRow = {
    rowNumber: number;
    title: string;
    artistID: string;
    artistName: string;
    genreID: string;
    genreName: string;
    releaseYear: string;
    price: string;
    stockQuantity: string;
    description: string;
    imageURL: string;
};

export type ParsedImportValidationError = {
    rowNumber: number;
    message: string;
};

const normalizeHeader = (value: string) =>
    value.trim().toLowerCase().replace(/[\s_-]+/g, '');

const toCellValue = (value: unknown) => {
    if (value === null || value === undefined) {
        return '';
    }

    return String(value);
};

const parseDelimitedLine = (line: string, delimiter: string) => {
    const values: string[] = [];
    let current = '';
    let insideQuotes = false;

    for (let index = 0; index < line.length; index++) {
        const char = line[index];

        if (char === '"') {
            if (insideQuotes && line[index + 1] === '"') {
                current += '"';
                index++;
                continue;
            }

            insideQuotes = !insideQuotes;
            continue;
        }

        if (char === delimiter && !insideQuotes) {
            values.push(current.trim());
            current = '';
            continue;
        }

        current += char;
    }

    values.push(current.trim());
    return values;
};

const detectDelimiter = (headerLine: string) => {
    const semicolons = (headerLine.match(/;/g) || []).length;
    const commas = (headerLine.match(/,/g) || []).length;
    return semicolons > commas ? ';' : ',';
};

const mapObjectToRow = (source: Record<string, unknown>, index: number): ParsedAlbumImportRow => {
    const nestedArtist = source.artist && typeof source.artist === 'object'
        ? source.artist as Record<string, unknown>
        : null;
    const nestedGenre = source.genre && typeof source.genre === 'object'
        ? source.genre as Record<string, unknown>
        : null;

    return {
        rowNumber: Number(source.rowNumber) > 0 ? Number(source.rowNumber) : index + 1,
        title: toCellValue(source.title),
        artistID: toCellValue(source.artistID ?? source.artistId),
        artistName: toCellValue(source.artistName ?? nestedArtist?.name ?? source.artist),
        genreID: toCellValue(source.genreID ?? source.genreId),
        genreName: toCellValue(source.genreName ?? nestedGenre?.name ?? source.genre),
        releaseYear: toCellValue(source.releaseYear),
        price: toCellValue(source.price),
        stockQuantity: toCellValue(source.stockQuantity),
        description: toCellValue(source.description),
        imageURL: toCellValue(source.imageURL ?? source.imageUrl),
    };
};

export const parseAlbumImportText = (text: string, fileName: string): ParsedAlbumImportRow[] => {
    const trimmed = text.trim();
    if (!trimmed) {
        throw new Error('Файл пуст. Добавьте данные для импорта.');
    }

    const lowerFileName = fileName.toLowerCase();
    if (lowerFileName.endsWith('.json') || trimmed.startsWith('[')) {
        const parsed = JSON.parse(trimmed);
        if (!Array.isArray(parsed)) {
            throw new Error('JSON для импорта должен быть массивом объектов.');
        }

        return parsed.map((item, index) => mapObjectToRow((item ?? {}) as Record<string, unknown>, index));
    }

    const lines = trimmed
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(Boolean);

    if (lines.length < 2) {
        throw new Error('CSV должен содержать заголовок и хотя бы одну строку данных.');
    }

    const delimiter = detectDelimiter(lines[0]);
    const headers = parseDelimitedLine(lines[0], delimiter).map(normalizeHeader);

    return lines.slice(1).map((line, index) => {
        const cells = parseDelimitedLine(line, delimiter);
        const row = Object.fromEntries(headers.map((header, headerIndex) => [header, cells[headerIndex] ?? '']));

        return {
            rowNumber: index + 2,
            title: row.title ?? '',
            artistID: row.artistid ?? '',
            artistName: row.artistname ?? row.artist ?? '',
            genreID: row.genreid ?? '',
            genreName: row.genrename ?? row.genre ?? '',
            releaseYear: row.releaseyear ?? '',
            price: row.price ?? '',
            stockQuantity: row.stockquantity ?? '',
            description: row.description ?? '',
            imageURL: row.imageurl ?? '',
        };
    });
};

export const validateParsedImportRows = (rows: ParsedAlbumImportRow[]): ParsedImportValidationError[] => {
    const currentYear = new Date().getFullYear() + 1;

    return rows.flatMap(row => {
        const errors: string[] = [];

        if (!row.title.trim()) {
            errors.push('Укажите название альбома.');
        } else if (row.title.trim().length > 200) {
            errors.push('Название не должно превышать 200 символов.');
        }

        const hasArtistId = Number.isInteger(Number(row.artistID)) && Number(row.artistID) > 0;
        if (!hasArtistId && !row.artistName.trim()) {
            errors.push('Укажите исполнителя по имени или ID.');
        }

        const hasGenreId = Number.isInteger(Number(row.genreID)) && Number(row.genreID) > 0;
        if (!hasGenreId && !row.genreName.trim()) {
            errors.push('Укажите жанр по имени или ID.');
        }

        if (row.releaseYear.trim()) {
            const releaseYear = Number(row.releaseYear);
            if (!Number.isInteger(releaseYear) || releaseYear < 1900 || releaseYear > currentYear) {
                errors.push(`Год выпуска должен быть в диапазоне 1900-${currentYear}.`);
            }
        }

        const price = Number(row.price);
        if (!Number.isFinite(price) || price <= 0 || price > 9_999_999) {
            errors.push('Цена должна быть больше 0 и не превышать 9 999 999.');
        }

        const stockQuantity = Number(row.stockQuantity);
        if (!Number.isInteger(stockQuantity) || stockQuantity < 0 || stockQuantity > 100_000) {
            errors.push('Остаток на складе должен быть в диапазоне 0-100000.');
        }

        if (row.description.trim().length > 2000) {
            errors.push('Описание не должно превышать 2000 символов.');
        }

        if (row.imageURL.trim() && !isSupportedImageUrl(row.imageURL)) {
            errors.push('Укажите корректный абсолютный URL изображения.');
        }

        return errors.map(message => ({
            rowNumber: row.rowNumber,
            message,
        }));
    });
};

export const mapParsedRowsToImportPayload = (rows: ParsedAlbumImportRow[]) =>
    rows.map(row => ({
        rowNumber: row.rowNumber,
        title: row.title.trim(),
        artistID: row.artistID.trim() ? Number(row.artistID) : null,
        artistName: row.artistName.trim() || null,
        genreID: row.genreID.trim() ? Number(row.genreID) : null,
        genreName: row.genreName.trim() || null,
        releaseYear: row.releaseYear.trim() ? Number(row.releaseYear) : null,
        price: row.price.trim() ? Number(row.price) : null,
        stockQuantity: row.stockQuantity.trim() ? Number(row.stockQuantity) : null,
        description: row.description.trim() || null,
        imageURL: row.imageURL.trim() || null,
    }));
