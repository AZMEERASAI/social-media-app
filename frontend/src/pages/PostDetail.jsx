import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import PostCard from '../components/PostCard';
import Comment from '../components/Comment';
import { useAuth } from '../context/AuthContext';
import { MessageCircle } from 'lucide-react';

const PostDetail = () => {
    const { id } = useParams();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const [commentContent, setCommentContent] = useState('');

    useEffect(() => {
        fetchPost();
    }, [id, user]);

    const fetchPost = async () => {
        try {
            const res = await api.get(`posts/${id}/`);
            setPost(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!commentContent.trim()) return;

        try {
            const res = await api.post('comments/', {
                content: commentContent,
                post: id,
                parent: null
            });
            // Add to beginning of comments list
            setPost({
                ...post,
                comments: [res.data, ...post.comments],
                comments_count: post.comments_count + 1
            });
            setCommentContent('');
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div className="text-center py-20">Loading...</div>;
    if (!post) return <div className="text-center py-20">Post not found</div>;

    return (
        <div className="max-w-3xl mx-auto">
            <PostCard post={post} isDetail />

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                    <MessageCircle className="mr-2" size={20} />
                    Comments ({post.comments_count})
                </h3>

                {user && (
                    <form onSubmit={handleCommentSubmit} className="mb-8">
                        <textarea
                            value={commentContent}
                            onChange={(e) => setCommentContent(e.target.value)}
                            placeholder="Write a comment..."
                            className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none min-h-[80px] outline-none"
                        />
                        <div className="flex justify-end mt-2">
                            <button
                                type="submit"
                                disabled={!commentContent.trim()}
                                className="bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
                            >
                                Comment
                            </button>
                        </div>
                    </form>
                )}

                <div className="space-y-6">
                    {post.comments.map(comment => (
                        <Comment key={comment.id} comment={comment} />
                    ))}
                    {post.comments.length === 0 && (
                        <p className="text-gray-500 text-center py-4">No comments yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PostDetail;
