import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { ArrowUpRight, Disc3, Mail, MapPin, Phone } from 'lucide-react';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Catalog from './pages/Catalog';
import Cart from './pages/Cart';
import Login from './pages/Login';
import Checkout from './pages/Checkout';
const AlbumDetail = lazy(() => import('./pages/AlbumDetail'));

const Orders = lazy(() => import('./pages/Orders'));
const Admin = lazy(() => import('./pages/Admin'));
const Register = lazy(() => import('./pages/Register'));
const Profile = lazy(() => import('./pages/Profile'));

const Loader = () => (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
        <div className="poster-border-sm bg-[var(--paper-soft)] px-8 py-6 text-center">
            <Disc3 className="mx-auto h-8 w-8 animate-spin text-[var(--coral)]" />
            <div className="mt-3 text-sm font-bold uppercase tracking-[0.22em]">Загрузка</div>
        </div>
    </div>
);

function Footer() {
    return (
        <footer className="mt-20 border-t-2 border-[var(--line)] bg-[var(--ink)] text-[var(--paper-soft)]">
            <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 md:grid-cols-12 md:px-8">
                <div className="md:col-span-6">
                    <Link to="/" className="inline-flex items-center gap-3">
                        <span className="grid h-12 w-12 place-items-center rounded-full bg-[var(--sun)] text-[var(--ink)]">
                            <Disc3 className="h-7 w-7" />
                        </span>
                        <span className="display-font text-3xl leading-none">VINYL STORE</span>
                    </Link>
                    <p className="mt-6 max-w-xl text-lg text-white/72">
                        Магазин винила в формате музыкального афишного архива: редкие релизы, новые поступления,
                        подарочные заказы и подборки для коллекционеров.
                    </p>
                </div>

                <div className="md:col-span-3">
                    <div className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--sun)]">Навигация</div>
                    <div className="mt-5 space-y-3 text-lg font-semibold">
                        <Link className="flex items-center gap-2 hover:text-[var(--sun)]" to="/">Каталог <ArrowUpRight className="h-4 w-4" /></Link>
                        <Link className="flex items-center gap-2 hover:text-[var(--sun)]" to="/orders">Заказы <ArrowUpRight className="h-4 w-4" /></Link>
                        <Link className="flex items-center gap-2 hover:text-[var(--sun)]" to="/profile">Профиль <ArrowUpRight className="h-4 w-4" /></Link>
                    </div>
                </div>

                <div className="md:col-span-3">
                    <div className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--sun)]">Контакты</div>
                    <div className="mt-5 space-y-3 text-white/75">
                        <div className="flex gap-3"><MapPin className="mt-1 h-4 w-4 text-[var(--sun)]" /> Москва, Тверская 12</div>
                        <div className="flex gap-3"><Phone className="mt-1 h-4 w-4 text-[var(--sun)]" /> +7 (495) 123-45-67</div>
                        <div className="flex gap-3"><Mail className="mt-1 h-4 w-4 text-[var(--sun)]" /> hello@vinylstore.ru</div>
                    </div>
                </div>
            </div>
            <div className="border-t-2 border-white/15 px-5 py-5 text-center text-xs font-bold uppercase tracking-[0.2em] text-white/55">
                © {new Date().getFullYear()} Vinyl Store. Curated for loud rooms.
            </div>
        </footer>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <CartProvider>
                    <div className="min-h-screen flex flex-col text-[var(--ink)]">
                        <Navbar />
                        <main className="flex-1">
                            <Routes>
                                <Route path="/" element={<Catalog />} />
                                <Route path="/cart" element={<Cart />} />
                                <Route path="/login" element={<Login />} />
                                <Route path="/checkout" element={<Checkout />} />
                                <Route path="/register" element={<Suspense fallback={<Loader />}><Register /></Suspense>} />
                                <Route path="/orders" element={<Suspense fallback={<Loader />}><Orders /></Suspense>} />
                                <Route path="/profile" element={<Suspense fallback={<Loader />}><Profile /></Suspense>} />
                                <Route path="/admin" element={<Suspense fallback={<Loader />}><Admin /></Suspense>} />
                                <Route path="/album/:id" element={<Suspense fallback={<Loader />}><AlbumDetail /></Suspense>} />
                            </Routes>
                        </main>
                        <Footer />
                    </div>
                </CartProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}
