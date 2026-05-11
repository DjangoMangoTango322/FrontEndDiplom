import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { CartItem, Album } from '../types';

interface CartContextType {
    cart: CartItem[];
    addToCart: (album: Album) => void;
    removeFromCart: (albumID: number) => void;
    updateQuantity: (albumID: number, quantity: number) => void;
    clearCart: () => void;
    getTotal: () => number;
    getItemCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [cart, setCart] = useState<CartItem[]>([]);

    // Load from localStorage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            setCart(JSON.parse(savedCart));
        }
    }, []);

    // Save to localStorage whenever cart changes
    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cart));
    }, [cart]);

    const addToCart = (album: Album) => {
        setCart(prev => {
            const existing = prev.find(item => item.albumID === album.albumID);
            if (existing) {
                return prev.map(item =>
                    item.albumID === album.albumID
                        ? { ...item, quantity: Math.min(item.quantity + 1, album.stockQuantity) }
                        : item
                );
            }
            return [...prev, { ...album, quantity: 1 }];
        });
    };

    const removeFromCart = (albumID: number) => {
        setCart(prev => prev.filter(item => item.albumID !== albumID));
    };

    const updateQuantity = (albumID: number, quantity: number) => {
        if (quantity < 1) return;
        setCart(prev =>
            prev.map(item =>
                item.albumID === albumID
                    ? { ...item, quantity: Math.min(quantity, item.stockQuantity) }
                    : item
            )
        );
    };

    const clearCart = () => setCart([]);

    const getTotal = () =>
        cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const getItemCount = () =>
        cart.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <CartContext.Provider value={{
            cart, addToCart, removeFromCart, updateQuantity, clearCart, getTotal, getItemCount
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) throw new Error('useCart must be used within CartProvider');
    return context;
};