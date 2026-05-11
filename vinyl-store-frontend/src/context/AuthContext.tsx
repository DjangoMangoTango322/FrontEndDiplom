import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface AuthContextType {
    isAuthenticated: boolean;
    role: string | null;
    username: string | null;
    login: (token: string, role: string, username: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [role, setRole] = useState<string | null>(null);
    const [username, setUsername] = useState<string | null>(null);

    const syncFromStorage = () => {
        const token = localStorage.getItem('token');
        const savedRole = localStorage.getItem('role');
        const savedUsername = localStorage.getItem('username');

        if (token && savedRole && savedUsername) {
            setIsAuthenticated(true);
            setRole(savedRole);
            setUsername(savedUsername);
        } else {
            setIsAuthenticated(false);
            setRole(null);
            setUsername(null);
        }
    };

    useEffect(() => {
        syncFromStorage();
        const onStorage = (e: StorageEvent) => {
            if (e.key === 'token' || e.key === 'role' || e.key === 'username') {
                syncFromStorage();
            }
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    const login = (token: string, userRole: string, userName: string) => {
        localStorage.setItem('token', token);
        localStorage.setItem('role', userRole);
        localStorage.setItem('username', userName);

        setIsAuthenticated(true);
        setRole(userRole);
        setUsername(userName);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('username');
        setIsAuthenticated(false);
        setRole(null);
        setUsername(null);
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, role, username, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};