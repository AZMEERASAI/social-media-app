import React, { useEffect, useState } from 'react';
import api from '../api';
import PostCard from '../components/PostCard';
import { useAuth } from '../context/AuthContext';
import { Plus } from 'lucide-react';
import CreatePost from '../components/CreatePost';

const Feed = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const [showCreate, setShowCreate] = useState(false);

    useEffect(() => {
        fetchPosts();
    }, [user]); // Re-fetch on user auth change to update like status

    const fetchPosts = async () => {
        try {
            const res = await api.get('posts/');
            setPosts(res.data.results || res.data); // Handle pagination or list
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handlePostCreated = (newPost) => {
        setPosts([newPost, ...posts]);
        setShowCreate(false);
    };

    if (loading) return <div className="text-center py-20">Loading...</div>;

    return (
        <div className="max-w-2xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Feed</h1>
                {user && (
                    <button
                        onClick={() => setShowCreate(!showCreate)}
                        className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-full font-medium shadow-lg hover:bg-blue-700 transition-all hover:scale-105 active:scale-95"
                    >
                        <Plus size={20} />
                        <span>New Post</span>
                    </button>
                )}
            </div>

            {showCreate && <CreatePost onSuccess={handlePostCreated} onCancel={() => setShowCreate(false)} />}

            <div className="space-y-4">
                {posts.map(post => (
                    <PostCard key={post.id} post={post} />
                ))}
                {posts.length === 0 && (
                    <div className="text-center py-20 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
                        No posts yet. Be the first to start the conversation!
                    </div>
                )}
            </div>
        </div>
    );
};

export default Feed;
