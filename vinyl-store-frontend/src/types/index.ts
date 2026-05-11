export interface Artist {
    artistID: number;
    name: string;
    bio?: string;
}

export interface Genre {
    genreID: number;
    name: string;
}

export interface Album {
    albumID: number;
    title: string;
    artistID: number;
    artist?: Artist;
    genreID: number;
    genre?: Genre;
    releaseYear?: number;
    price: number;
    stockQuantity: number;
    description?: string;
    imageURL: string;
    createdAt?: string;
}

export interface User {
    userID: number;
    username: string;
    email: string;
    role: 'Customer' | 'Admin';
}

export interface CartItem extends Album {
    quantity: number;
}

export interface OrderItem {
    album: Album;
    quantity: number;
    priceAtPurchase: number;
}

export interface Order {
    orderID: number;
    orderDate: string;
    totalAmount: number;
    status: 'Pending' | 'Completed' | 'Cancelled';
    items: OrderItem[];
}