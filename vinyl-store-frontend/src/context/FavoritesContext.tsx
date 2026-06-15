import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import toast from 'react-hot-toast'; // Теперь мы используем этот импорт
import api from '../api/api';
import { useAuth } from './AuthContext';
import type { Album } from '../types';

interface FavoritesContextType {
    favorites: Album[];
    isFavoritesLoading: boolean;
    isFavorite: (albumId: number) => boolean;
    toggleFavorite: (album: Album) => Promise<boolean>;
    removeFavorite: (albumId: number) => Promise<void>;
    refreshFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const [favorites, setFavorites] = useState<Album[]>([]);
    const [isFavoritesLoading, setIsFavoritesLoading] = useState(false);

    const favoriteIds = useMemo(() => new Set(favorites.map(album => album.albumID)), [favorites]);

    const refreshFavorites = useCallback(async () => {
        if (!isAuthenticated) {
            setFavorites([]);
            setIsFavoritesLoading(false);
            return;
        }

        setIsFavoritesLoading(true);

        try {
            const response = await api.get<Album[]>('/favorites');
            setFavorites(response.data);
        } finally {
            setIsFavoritesLoading(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        void refreshFavorites();
    }, [refreshFavorites]);

    const removeFavorite = useCallback(async (albumId: number) => {
        if (!isAuthenticated) {
            return;
        }

        await api.delete(`/favorites/${albumId}`);
        setFavorites(prev => prev.filter(album => album.albumID !== albumId));
        toast.success('Удалено из избранного'); // Можно добавить и сюда на всякий случай
    }, [isAuthenticated]);

    const toggleFavorite = useCallback(async (album: Album) => {
        if (!isAuthenticated) {
            // 1. Показываем уведомление об ошибке
            toast.error('Для добавления в избранное нужно войти в аккаунт');

            const next = `${window.location.pathname}${window.location.search}`;

            // 2. Делаем небольшую задержку, чтобы пользователь успел прочитать текст
            setTimeout(() => {
                window.location.href = `/login?next=${encodeURIComponent(next)}`;
            }, 1500);

            return false;
        }

        if (favoriteIds.has(album.albumID)) {
            await api.delete(`/favorites/${album.albumID}`);
            setFavorites(prev => prev.filter(item => item.albumID !== album.albumID));
            // 3. Уведомление об удалении
            toast.success('Удалено из избранного');
            return false;
        }

        await api.post(`/favorites/${album.albumID}`);
        setFavorites(prev => prev.some(item => item.albumID === album.albumID) ? prev : [album, ...prev]);
        // 4. Уведомление об успешном добавлении
        toast.success('Добавлено в избранное!');
        return true;
    }, [favoriteIds, isAuthenticated]);

    const isFavorite = useCallback((albumId: number) => favoriteIds.has(albumId), [favoriteIds]);

    return (
        <FavoritesContext.Provider value={{
            favorites,
            isFavoritesLoading,
            isFavorite,
            toggleFavorite,
            removeFavorite,
            refreshFavorites,
        }}
        >
            {children}
        </FavoritesContext.Provider>
    );
};

export const useFavorites = () => {
    const context = useContext(FavoritesContext);
    if (!context) {
        throw new Error('useFavorites must be used within FavoritesProvider');
    }
    return context;
};