import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
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
    }, [isAuthenticated]);

    const toggleFavorite = useCallback(async (album: Album) => {
        if (!isAuthenticated) {
            const next = `${window.location.pathname}${window.location.search}`;
            window.location.href = `/login?next=${encodeURIComponent(next)}`;
            return false;
        }

        if (favoriteIds.has(album.albumID)) {
            await api.delete(`/favorites/${album.albumID}`);
            setFavorites(prev => prev.filter(item => item.albumID !== album.albumID));
            return false;
        }

        await api.post(`/favorites/${album.albumID}`);
        setFavorites(prev => prev.some(item => item.albumID === album.albumID) ? prev : [album, ...prev]);
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
