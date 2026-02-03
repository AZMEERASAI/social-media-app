import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkUser();
    }, []);

    const checkUser = async () => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const res = await api.get('me/');
                setUser(res.data);
            } catch (err) {
                localStorage.removeItem('token');
                setUser(null);
            }
        }
        setLoading(false);
    };

    const login = async (username, password) => {
        try {
            const res = await api.post('auth/login/', { username, password });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user_id', res.data.user_id);
            setUser({ username: res.data.username, id: res.data.user_id });
            return true;
        } catch (err) {
            console.error(err);
            return false;
        }
    };

    const register = async (username, password) => {
        try {
            const res = await api.post('auth/register/', { username, password });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user_id', res.data.user_id);
            setUser({ username: res.data.username, id: res.data.user_id });
            return true;
        } catch (err) {
            console.error(err);
            throw err;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user_id');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
