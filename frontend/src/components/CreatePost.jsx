import React, { useState } from 'react';
import api from '../api';
import { Send, X } from 'lucide-react';

const CreatePost = ({ onSuccess, onCancel }) => {
    const [content, setContent] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim()) return;
        setSubmitting(true);
        try {
            const res = await api.post('posts/', { content });
            onSuccess(res.data);
            setContent('');
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 animate-in slide-in-from-top-4 duration-300">
            <form onSubmit={handleSubmit}>
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-gray-700">Create Post</h3>
                    <button type="button" onClick={onCancel} className="text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="What's on your mind?"
                    className="w-full px-4 py-3 rounded-lg bg-gray-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-0 transition-all resize-none min-h-[100px]"
                    autoFocus
                />
                <div className="flex justify-end mt-3">
                    <button
                        type="submit"
                        disabled={submitting || !content.trim()}
                        className="flex items-center space-x-2 bg-blue-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <span>Post</span>
                        <Send size={16} />
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreatePost;
