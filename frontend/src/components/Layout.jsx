import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Trophy, Home, User } from 'lucide-react';
import clsx from 'clsx';

const Layout = () => {
    const { user, logout } = useAuth();
    const location = useLocation();

    const NavItem = ({ to, icon: Icon, label }) => {
        const isActive = location.pathname === to;
        return (
            <Link
                to={to}
                className={clsx(
                    "flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors",
                    isActive ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
                )}
            >
                <Icon size={20} />
                <span className="font-medium">{label}</span>
            </Link>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <Link to="/" className="text-2xl font-bold text-blue-600 tracking-tight">
                                SocialMini
                            </Link>
                            <div className="hidden md:flex ml-10 space-x-4">
                                <NavItem to="/" icon={Home} label="Feed" />
                                <NavItem to="/leaderboard" icon={Trophy} label="Leaderboard" />
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            {user ? (
                                <>
                                    <div className="flex items-center space-x-2 text-gray-700">
                                        <User size={20} />
                                        <span className="font-semibold">{user.username}</span>
                                    </div>
                                    <button
                                        onClick={logout}
                                        className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                                    >
                                        <LogOut size={20} />
                                    </button>
                                </>
                            ) : (
                                <Link
                                    to="/login"
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Login
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </nav>
            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
