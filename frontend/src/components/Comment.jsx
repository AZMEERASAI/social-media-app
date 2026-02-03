import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, CornerDownRight } from 'lucide-react';
import api from '../api';
import clsx from 'clsx';

const Comment = ({ comment, onReplySuccess, depth = 0 }) => {
    const { user } = useAuth();
    const [isReplying, setIsReplying] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const [likes, setLikes] = useState(comment.likes_count);
    const [isLiked, setIsLiked] = useState(comment.is_liked);
    const [replies, setReplies] = useState(comment.replies || []);

    const handleLike = async () => {
        if (!user) return;
        const prevLikes = likes;
        const prevIsLiked = isLiked;

        setLikes(isLiked ? likes - 1 : likes + 1);
        setIsLiked(!isLiked);

        try {
            await api.post('likes/', { target_type: 'comment', target_id: comment.id });
        } catch (err) {
            setLikes(prevLikes);
            setIsLiked(prevIsLiked);
        }
    };

    const handleReplySubmit = async (e) => {
        e.preventDefault();
        if (!replyContent.trim()) return;

        try {
            const res = await api.post('comments/', {
                content: replyContent,
                post: comment.post, // Ensure comment object has post ID
                parent: comment.id
            });
            // Add new reply to local state
            // The API returns the comment. We need to mimic the structure if it's not full.
            // Or re-fetch? Re-fetching tree is expensive. Pushing to state is better.
            // But the returned serializer is CommentSerializer which has replies=[]
            setReplies([...replies, res.data]);
            setReplyContent('');
            setIsReplying(false);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className={clsx("flex flex-col group", depth > 0 && "mt-3")}>
            <div className="flex space-x-3">
                {/* Avatar */}
                <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                        {comment.author.username[0].toUpperCase()}
                    </div>
                </div>

                <div className="flex-1 min-w-0">
                    <div className="bg-gray-50 rounded-2xl rounded-tl-none px-4 py-3 inline-block relative group-hover:bg-gray-100 transition-colors max-w-full">
                        <div className="flex items-center space-x-2 mb-1">
                            <span className="font-semibold text-sm text-gray-900">{comment.author.username}</span>
                            <span className="text-xs text-gray-500">
                                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                            </span>
                        </div>
                        <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">{comment.content}</p>
                    </div>

                    <div className="flex items-center space-x-4 mt-1 ml-1">
                        <button
                            onClick={handleLike}
                            className={clsx(
                                "flex items-center space-x-1 text-xs font-medium transition-colors",
                                isLiked ? "text-red-500" : "text-gray-500 hover:text-red-500"
                            )}
                        >
                            <Heart size={14} className={clsx(isLiked && "fill-current")} />
                            <span>{likes > 0 && likes} Like{likes !== 1 && 's'}</span>
                        </button>
                        <button
                            onClick={() => setIsReplying(!isReplying)}
                            className="flex items-center space-x-1 text-xs font-medium text-gray-500 hover:text-blue-600 transition-colors"
                        >
                            <MessageCircle size={14} />
                            <span>Reply</span>
                        </button>
                    </div>

                    {isReplying && (
                        <div className="mt-2 flex space-x-2 animate-in fade-in duration-200">
                            <div className="w-8"></div> {/* Spacer */}
                            <form onSubmit={handleReplySubmit} className="flex-1 flex gap-2">
                                <input
                                    type="text"
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    placeholder="Write a reply..."
                                    className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                                    autoFocus
                                />
                                <button
                                    type="submit"
                                    disabled={!replyContent.trim()}
                                    className="bg-blue-600 text-white px-3 py-1 rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50"
                                >
                                    Reply
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>

            {replies.length > 0 && (
                <div className="ml-4 pl-4 border-l-2 border-slate-100 mt-2 space-y-3">
                    {replies.map(reply => (
                        <Comment key={reply.id} comment={reply} depth={depth + 1} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default Comment;
