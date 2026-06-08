import type { Album } from '../types';

export const getAlbumDescription = (album: Album) => {
    if (album.description?.trim()) {
        return album.description;
    }

    const artist = album.artist?.name || 'исполнителя';
    const genre = album.genre?.name ? ` в жанре ${album.genre.name}` : '';
    const year = album.releaseYear ? `, издание ${album.releaseYear} года` : '';

    return `Виниловая пластинка ${artist}${genre}${year}. Подойдет для домашней коллекции, подарка или спокойного прослушивания на проигрывателе: плотный аналоговый звук, крупная обложка и ощущение настоящего музыкального релиза.`;
};
