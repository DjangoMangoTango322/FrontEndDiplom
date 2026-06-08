import React, { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import api from '../api/api';
import { useAuth } from './AuthContext';
import type { Album, CartItem, CartSummary } from '../types';

const GUEST_CART_KEY = 'cart';

type CartApiLine = {
    cartItemId: number;
    albumId: number;
    title: string;
    artistName: string;
    genreName: string;
    imageUrl?: string;
    quantity: number;
    stockQuantity: number;
    unitPrice: number;
    lineTotal: number;
};

type CartApiSummary = {
    items: CartApiLine[];
    subtotal: number;
    totalItems: number;
    distinctItems: number;
};

interface CartContextType {
    cart: CartItem[];
    isCartLoading: boolean;
    usesServerCart: boolean;
    addToCart: (album: Album, quantity?: number) => Promise<void>;
    removeFromCart: (albumID: number) => Promise<void>;
    updateQuantity: (albumID: number, quantity: number) => Promise<void>;
    clearCart: () => Promise<void>;
    refreshCart: () => Promise<void>;
    getTotal: (items?: CartItem[]) => number;
    getItemCount: (items?: CartItem[]) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const mapCartLine = (line: CartApiLine): CartItem => ({
    cartItemId: line.cartItemId,
    albumID: line.albumId,
    title: line.title,
    artist: {
        artistID: 0,
        name: line.artistName,
    },
    genre: {
        genreID: 0,
        name: line.genreName,
    },
    imageURL: line.imageUrl,
    quantity: line.quantity,
    stockQuantity: line.stockQuantity,
    price: Number(line.unitPrice),
    lineTotal: Number(line.lineTotal),
});

const normalizeGuestCartItem = (value: unknown): CartItem | null => {
    if (!value || typeof value !== 'object') {
        return null;
    }

    const item = value as Record<string, unknown>;
    const albumID = Number(item.albumID);
    const title = typeof item.title === 'string' ? item.title : '';
    const quantity = Number(item.quantity);
    const stockQuantity = Number(item.stockQuantity);
    const price = Number(item.price);

    if (!Number.isFinite(albumID) || albumID <= 0 || !title || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(price)) {
        return null;
    }

    const artist = item.artist && typeof item.artist === 'object'
        ? item.artist as { artistID?: number; name?: string }
        : undefined;
    const genre = item.genre && typeof item.genre === 'object'
        ? item.genre as { genreID?: number; name?: string }
        : undefined;

    return {
        cartItemId: typeof item.cartItemId === 'number' ? item.cartItemId : undefined,
        albumID,
        title,
        artist: artist?.name ? { artistID: artist.artistID ?? 0, name: artist.name } : undefined,
        genre: genre?.name ? { genreID: genre.genreID ?? 0, name: genre.name } : undefined,
        imageURL: typeof item.imageURL === 'string' ? item.imageURL : undefined,
        quantity,
        stockQuantity: Number.isFinite(stockQuantity) && stockQuantity > 0 ? stockQuantity : 1,
        price,
        lineTotal: Number(item.lineTotal),
    };
};

const readGuestCart = (): CartItem[] => {
    try {
        const raw = localStorage.getItem(GUEST_CART_KEY);
        if (!raw) {
            return [];
        }

        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
            return [];
        }

        return parsed
            .map(normalizeGuestCartItem)
            .filter((item): item is CartItem => item !== null);
    } catch {
        return [];
    }
};

const writeGuestCart = (items: CartItem[]) => {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
};

const mapCartSummary = (summary: CartApiSummary): CartSummary => ({
    items: summary.items.map(mapCartLine),
    subtotal: Number(summary.subtotal),
    totalItems: summary.totalItems,
    distinctItems: summary.distinctItems,
});

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isCartLoading, setIsCartLoading] = useState(true);

    const applyGuestCart = useCallback(() => {
        setCart(readGuestCart());
        setIsCartLoading(false);
    }, []);

    const refreshCart = useCallback(async () => {
        if (!isAuthenticated) {
            applyGuestCart();
            return;
        }

        setIsCartLoading(true);

        try {
            const response = await api.get<CartApiSummary>('/cart');
            setCart(mapCartSummary(response.data).items);
        } finally {
            setIsCartLoading(false);
        }
    }, [applyGuestCart, isAuthenticated]);

    useEffect(() => {
        if (!isAuthenticated) {
            applyGuestCart();
            return;
        }

        let cancelled = false;

        const syncGuestCart = async () => {
            setIsCartLoading(true);

            try {
                const guestCart = readGuestCart();
                const failedItems: CartItem[] = [];

                for (const item of guestCart) {
                    try {
                        await api.post('/cart/items', {
                            albumId: item.albumID,
                            quantity: item.quantity,
                        });
                    } catch {
                        failedItems.push(item);
                    }
                }

                writeGuestCart(failedItems);

                const response = await api.get<CartApiSummary>('/cart');
                if (!cancelled) {
                    setCart(mapCartSummary(response.data).items);
                }
            } catch {
                if (!cancelled) {
                    setCart([]);
                }
            } finally {
                if (!cancelled) {
                    setIsCartLoading(false);
                }
            }
        };

        void syncGuestCart();

        return () => {
            cancelled = true;
        };
    }, [applyGuestCart, isAuthenticated]);

    const addToCart = useCallback(async (album: Album, quantity = 1) => {
        if (!isAuthenticated) {
            setCart(prev => {
                const existing = prev.find(item => item.albumID === album.albumID);
                const next = existing
                    ? prev.map(item =>
                        item.albumID === album.albumID
                            ? { ...item, quantity: Math.min(item.quantity + quantity, album.stockQuantity) }
                            : item)
                    : [...prev, {
                        albumID: album.albumID,
                        title: album.title,
                        artist: album.artist,
                        genre: album.genre,
                        imageURL: album.imageURL,
                        quantity,
                        stockQuantity: album.stockQuantity,
                        price: album.price,
                    }];

                writeGuestCart(next);
                return next;
            });
            return;
        }

        const response = await api.post<CartApiSummary>('/cart/items', {
            albumId: album.albumID,
            quantity,
        });

        setCart(mapCartSummary(response.data).items);
    }, [isAuthenticated]);

    const removeFromCart = useCallback(async (albumID: number) => {
        if (!isAuthenticated) {
            setCart(prev => {
                const next = prev.filter(item => item.albumID !== albumID);
                writeGuestCart(next);
                return next;
            });
            return;
        }

        const cartItem = cart.find(item => item.albumID === albumID);
        if (!cartItem?.cartItemId) {
            return;
        }

        await api.delete(`/cart/items/${cartItem.cartItemId}`);
        setCart(prev => prev.filter(item => item.albumID !== albumID));
    }, [cart, isAuthenticated]);

    const updateQuantity = useCallback(async (albumID: number, quantity: number) => {
        if (quantity < 1) {
            return;
        }

        if (!isAuthenticated) {
            setCart(prev => {
                const next = prev.map(item =>
                    item.albumID === albumID
                        ? { ...item, quantity: Math.min(quantity, item.stockQuantity) }
                        : item
                );
                writeGuestCart(next);
                return next;
            });
            return;
        }

        const cartItem = cart.find(item => item.albumID === albumID);
        if (!cartItem?.cartItemId) {
            return;
        }

        const response = await api.put<CartApiSummary>(`/cart/items/${cartItem.cartItemId}`, { quantity });
        setCart(mapCartSummary(response.data).items);
    }, [cart, isAuthenticated]);

    const clearCart = useCallback(async () => {
        if (!isAuthenticated) {
            setCart([]);
            writeGuestCart([]);
            return;
        }

        await Promise.all(
            cart
                .filter(item => item.cartItemId)
                .map(item => api.delete(`/cart/items/${item.cartItemId}`))
        );

        setCart([]);
    }, [cart, isAuthenticated]);

    const getTotal = useCallback((items: CartItem[] = cart) =>
        items.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);

    const getItemCount = useCallback((items: CartItem[] = cart) =>
        items.reduce((sum, item) => sum + item.quantity, 0), [cart]);

    return (
        <CartContext.Provider value={{
            cart,
            isCartLoading,
            usesServerCart: isAuthenticated,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            refreshCart,
            getTotal,
            getItemCount,
        }}
        >
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within CartProvider');
    }
    return context;
};
