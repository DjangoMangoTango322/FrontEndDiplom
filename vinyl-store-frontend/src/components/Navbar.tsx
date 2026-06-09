import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ChevronDown, Disc3, Heart, LogOut, Menu, ShoppingBag, User, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';

export default function Navbar() {
    const { getItemCount } = useCart();
    const { isAuthenticated, role, username, logout } = useAuth();
    const { favorites } = useFavorites();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
        setIsProfileOpen(false);
        setIsMobileMenuOpen(false);
    };

    const navLinks = [
        { to: '/', label: 'Каталог' },
        ...(isAuthenticated ? [{ to: '/favorites', label: 'Избранное' }] : []),
        ...(isAuthenticated ? [{ to: '/orders', label: 'Мои заказы' }] : []),
        ...(role === 'Admin' ? [{ to: '/admin', label: 'Админ' }] : []),
    ];

    const linkClass = ({ isActive }: { isActive: boolean }) =>
        `border-b-2 px-1 py-1 text-sm font-black uppercase tracking-[0.18em] transition-colors ${
            isActive ? 'border-[var(--ink)] text-[var(--ink)]' : 'border-transparent text-[var(--muted)] hover:text-[var(--ink)]'
        }`;

    return (
        <nav className="sticky top-0 z-50 border-b-2 border-[var(--line)] bg-[var(--paper)]/95 backdrop-blur">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-1.5 xs:gap-4 px-3 xs:px-5 py-2.5 xs:py-4 md:px-8">

                <Link to="/" className="flex items-center gap-1.5 xs:gap-3 min-w-0 flex-shrink-1">
                    <span className="grid h-9 w-9 xs:h-11 xs:w-11 place-items-center rounded-full border-2 border-[var(--line)] bg-[var(--sun)] flex-shrink-0">
                        <Disc3 className="h-5 w-5 xs:h-7 xs:w-7" />
                    </span>
                    <span className="min-w-0 truncate">
                        <span className="display-font block text-lg xs:text-xl md:text-2xl leading-none truncate">VINYL STORE</span>
                        <span className="mt-1 hidden text-[10px] font-black uppercase tracking-[0.18em] text-[var(--muted)] sm:block">
                            магазин виниловых пластинок
                        </span>
                    </span>
                </Link>

                <div className="hidden items-center gap-7 md:flex">
                    {navLinks.map(link => (
                        <NavLink key={link.to} to={link.to} className={linkClass}>
                            {link.label}
                        </NavLink>
                    ))}
                </div>

                <div className="flex items-center gap-1 xs:gap-3 flex-shrink-0">
                    {isAuthenticated && (
                        <button
                            onClick={() => navigate('/favorites')}
                            className="relative grid h-9 w-9 xs:h-11 xs:w-11 place-items-center border-2 border-[var(--line)] bg-[var(--paper-soft)] transition-transform hover:-translate-y-0.5"
                            title="Избранное"
                        >
                            <Heart className="h-4 w-4 xs:h-5 xs:w-5" />
                            {favorites.length > 0 && (
                                <span className="absolute -right-1.5 -top-1.5 grid h-4 min-w-4 xs:h-6 xs:min-w-6 place-items-center rounded-full border-2 border-[var(--line)] bg-[var(--sun)] px-0.5 text-[9px] xs:text-xs font-black">
                                    {favorites.length}
                                </span>
                            )}
                        </button>
                    )}

                    <button
                        onClick={() => navigate('/cart')}
                        className="relative grid h-9 w-9 xs:h-11 xs:w-11 place-items-center border-2 border-[var(--line)] bg-[var(--paper-soft)] transition-transform hover:-translate-y-0.5"
                        title="Корзина"
                    >
                        <ShoppingBag className="h-4 w-4 xs:h-5 xs:w-5" />
                        {getItemCount() > 0 && (
                            <span className="absolute -right-1.5 -top-1.5 grid h-4 min-w-4 xs:h-6 xs:min-w-6 place-items-center rounded-full border-2 border-[var(--line)] bg-[var(--coral)] px-0.5 text-[9px] xs:text-xs font-black text-white">
                                {getItemCount()}
                            </span>
                        )}
                    </button>

                    {isAuthenticated ? (
                        <div className="relative">
                            <button
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                className="flex h-9 xs:h-11 items-center gap-1.5 border-2 border-[var(--line)] bg-[var(--paper-soft)] px-2 xs:px-3 font-bold text-sm xs:text-base"
                            >
                                <User className="h-4 w-4 xs:h-5 xs:w-5" />
                                <span className="hidden max-w-28 truncate md:block">{username}</span>
                                <ChevronDown className={`h-3 w-3 xs:h-4 xs:w-4 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isProfileOpen && (
                                <div className="poster-border-sm absolute right-0 mt-3 w-64 bg-[var(--paper-soft)] p-2 z-50">
                                    <div className="border-b-2 border-[var(--line)] px-3 py-3">
                                        <div className="font-black">{username}</div>
                                        <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--coral)]">{role}</div>
                                    </div>
                                    <Link to="/orders" className="block px-3 py-3 font-bold hover:bg-[var(--sun)]" onClick={() => setIsProfileOpen(false)}>
                                        Мои заказы
                                    </Link>
                                    <Link to="/favorites" className="block px-3 py-3 font-bold hover:bg-[var(--sun)]" onClick={() => setIsProfileOpen(false)}>
                                        Избранное
                                    </Link>
                                    <Link to="/profile" className="block px-3 py-3 font-bold hover:bg-[var(--sun)]" onClick={() => setIsProfileOpen(false)}>
                                        Профиль
                                    </Link>
                                    <button onClick={handleLogout} className="flex w-full items-center gap-2 px-3 py-3 text-left font-bold text-red-700 hover:bg-red-100">
                                        <LogOut className="h-4 w-4" /> Выйти
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <button
                            onClick={() => navigate('/login')}
                            className="hidden xs:inline-flex h-9 xs:h-11 items-center border-2 border-[var(--line)] bg-[var(--ink)] px-3 xs:px-5 text-xs xs:text-sm font-black uppercase tracking-[0.14em] text-white transition-transform hover:-translate-y-0.5 sm:block"
                        >
                            Войти
                        </button>
                    )}

                    <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="grid h-9 w-9 xs:h-11 xs:w-11 place-items-center border-2 border-[var(--line)] bg-[var(--sun)] md:hidden flex-shrink-0">
                        {isMobileMenuOpen ? <X className="h-4 w-4 xs:h-5 xs:w-5" /> : <Menu className="h-4 w-4 xs:h-5 xs:w-5" />}
                    </button>
                </div>
            </div>

            {isMobileMenuOpen && (
                <div className="border-t-2 border-[var(--line)] bg-[var(--paper-soft)] px-5 py-4 md:hidden">
                    <div className="space-y-2">
                        {navLinks.map(link => (
                            <Link
                                key={link.to}
                                to={link.to}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="block border-2 border-[var(--line)] bg-[var(--paper)] px-4 py-3 font-black uppercase tracking-[0.12em]"
                            >
                                {link.label}
                            </Link>
                        ))}
                        {!isAuthenticated && (
                            <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="block border-2 border-[var(--line)] bg-[var(--ink)] px-4 py-3 font-black uppercase tracking-[0.12em] text-white">
                                Войти
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}