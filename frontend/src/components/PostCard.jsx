import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Heart, Share2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import api from '../api';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';

const PostCard = ({ post, isDetail = false }) => {
    const { user } = useAuth();
    const [likes, setLikes] = useState(post.likes_count);
    const [isLiked, setIsLiked] = useState(post.is_liked);
    const [animating, setAnimating] = useState(false);

    const handleLike = async (e) => {
        e.preventDefault();
        if (!user) return; // Or show login modal

        // Optimistic API
        const previousLikes = likes;
        const previousIsLiked = isLiked;

        setIsLiked(!isLiked);
        setLikes(isLiked ? likes - 1 : likes + 1);
        setAnimating(true);
        setTimeout(() => setAnimating(false), 300);

        try {
            await api.post('likes/', { target_type: 'post', target_id: post.id });
        } catch (err) {
            console.error(err);
            // Revert
            setIsLiked(previousIsLiked);
            setLikes(previousLikes);
        }
    };

    return (
        <div className={clsx("bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden", isDetail ? "mb-6" : "mb-4 hover:shadow-md transition-shadow")}>
            <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                            {post.author.username[0].toUpperCase()}
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">{post.author.username}</h3>
                            <p className="text-sm text-gray-500">
                                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                            </p>
                        </div>
                    </div>
                </div>

                <Link to={`/posts/${post.id}`} className="block group">
                    <p className={clsx("text-gray-800 leading-relaxed mb-4", !isDetail && "line-clamp-3")}>
                        {post.content}
                    </p>
                </Link>

                <div className="flex items-center space-x-6 pt-4 border-t border-gray-50">
                    <button
                        onClick={handleLike}
                        className={clsx(
                            "flex items-center space-x-2 group transition-colors",
                            isLiked ? "text-red-500" : "text-gray-500 hover:text-red-500"
                        )}
                    >
                        <Heart
                            size={20}
                            className={clsx(
                                "transition-transform",
                                isLiked && "fill-current",
                                animating && "scale-125"
                            )}
                        />
                        <span className="font-medium">{likes || 0}</span>
                    </button>

                    <Link
                        to={`/posts/${post.id}`}
                        className="flex items-center space-x-2 text-gray-500 hover:text-blue-600 transition-colors"
                    >
                        <MessageSquare size={20} />
                        <span className="font-medium">{post.comments_count}</span>
                    </Link>

                    <button className="flex items-center space-x-2 text-gray-500 hover:text-green-600 transition-colors ml-auto">
                        <Share2 size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PostCard;
