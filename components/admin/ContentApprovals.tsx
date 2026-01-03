import React from 'react';
import { CheckCircle, X, FileText, Vote } from 'lucide-react';
import { BlogPost, Poll } from '../../types';

interface ContentApprovalsProps {
    pendingPosts: BlogPost[];
    pendingPolls: Poll[]; // You might need to add logic to pass this
    onApprovePost: (postId: string) => Promise<void>;
    onRejectPost: (postId: string) => Promise<void>;
    onApprovePoll: (pollId: string) => Promise<void>;
    onRejectPoll: (pollId: string) => Promise<void>;
}

export const ContentApprovals: React.FC<ContentApprovalsProps> = ({
    pendingPosts,
    pendingPolls,
    onApprovePost,
    onRejectPost,
    onApprovePoll,
    onRejectPoll
}) => {
    return (
        <div className="space-y-8">
            {/* Pending Posts */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <FileText size={24} className="text-orange-500" />
                        Pending Posts ({pendingPosts.length})
                    </h2>
                </div>
                {pendingPosts.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No pending posts to review.</div>
                ) : (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {pendingPosts.map(post => (
                            <div key={post.id} className="p-6 flex flex-col md:flex-row justify-between gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{post.title}</h3>
                                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                                        <span className="flex items-center gap-1">
                                            <img src={post.author.avatar} className="w-5 h-5 rounded-full" />
                                            {post.author.name}
                                        </span>
                                        <span>• {post.category}</span>
                                        <span>• {post.date}</span>
                                    </div>
                                    <p className="text-gray-600 dark:text-gray-300 line-clamp-2">{post.excerpt}</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <a
                                        href={`/${post.slug || post.id}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
                                    >
                                        Preview
                                    </a>
                                    <button
                                        onClick={() => onApprovePost(post.id)}
                                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 flex items-center gap-2"
                                    >
                                        <CheckCircle size={16} /> Approve
                                    </button>
                                    <button
                                        onClick={() => onRejectPost(post.id)}
                                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 flex items-center gap-2"
                                    >
                                        <X size={16} /> Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Pending Polls */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Vote size={24} className="text-purple-500" />
                        Pending Polls ({pendingPolls.length})
                    </h2>
                </div>
                {pendingPolls.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No pending polls to review.</div>
                ) : (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {pendingPolls.map(poll => (
                            <div key={poll.id} className="p-6 flex flex-col md:flex-row justify-between gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{poll.question}</h3>
                                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                                        <span>{poll.category}</span>
                                        <span>• {new Date(poll.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        {poll.options.map((opt, idx) => (
                                            <span key={idx} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">{opt.text}</span>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex items-start gap-2">
                                    <button
                                        onClick={() => onApprovePoll(poll.id)}
                                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 flex items-center gap-2"
                                    >
                                        <CheckCircle size={16} /> Approve
                                    </button>
                                    <button
                                        onClick={() => onRejectPoll(poll.id)}
                                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 flex items-center gap-2"
                                    >
                                        <X size={16} /> Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
