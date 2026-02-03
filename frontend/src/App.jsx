import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Feed from './pages/Feed';
import PostDetail from './pages/PostDetail';
import Leaderboard from './pages/Leaderboard';
import Login from './pages/Login';
import { useAuth } from './context/AuthContext';

const PrivateRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return null;
    // We allow guests to view feed? Requirement says "Users can create...", implying auth needed for actions.
    // But typically feed is public.
    // Let's make Feed public, actions protected.
    // The layout handles login button.
    return children;
};

function App() {
    return (
        <Routes>
            <Route path="/" element={<Layout />}>
                <Route index element={<Feed />} />
                <Route path="posts/:id" element={<PostDetail />} />
                <Route path="leaderboard" element={<Leaderboard />} />
                <Route path="login" element={<Login />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default App;
