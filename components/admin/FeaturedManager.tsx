import React from 'react';
import { Sparkles, Save, Loader2, GripVertical, Trash2, Plus } from 'lucide-react';
import { BlogPost } from '../../types';

interface FeaturedManagerProps {
    featuredPosts: BlogPost[];
    availablePosts: BlogPost[];
    isSavingFeatured: boolean;
    onSave: () => void;
    setFeaturedPosts: React.Dispatch<React.SetStateAction<BlogPost[]>>;
    setAvailablePosts: React.Dispatch<React.SetStateAction<BlogPost[]>>;
}

export const FeaturedManager: React.FC<FeaturedManagerProps> = ({
    featuredPosts,
    availablePosts,
    isSavingFeatured,
    onSave,
    setFeaturedPosts,
    setAvailablePosts
}) => {
    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <Sparkles className="text-yellow-500" />
                        Featured Posts Manager
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Choose and reorder the 3 posts shown in the homepage hero section</p>
                </div>
                <button
                    onClick={onSave}
                    disabled={isSavingFeatured}
                    className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-all flex items-center gap-2 disabled:opacity-50"
                >
                    {isSavingFeatured ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                    Save Changes
                </button>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Current Featured */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-xl font-bold mb-4">Current Featured ({featuredPosts.length}/3)</h2>
                    {featuredPosts.length === 0 ? (
                        <p className="text-center py-12 text-gray-500">No posts selected yet</p>
                    ) : (
                        <div className="space-y-4">
                            {featuredPosts.map((post, index) => (
                                <div
                                    key={post.id}
                                    draggable
                                    onDragStart={(e) => (e.dataTransfer as any).setData('index', index)}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        const fromIndex = Number((e.dataTransfer as any).getData('index'));
                                        const newPosts = [...featuredPosts];
                                        const [moved] = newPosts.splice(fromIndex, 1);
                                        newPosts.splice(index, 0, moved);
                                        setFeaturedPosts(newPosts);
                                    }}
                                    className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl cursor-move hover:shadow-md border-2 border-dashed border-transparent hover:border-primary-400 transition-all"
                                >
                                    <GripVertical className="text-gray-400" />
                                    <span className="text-2xl font-bold text-primary-600 w-8">{index + 1}</span>
                                    <img src={post.coverImage} alt="" className="w-16 h-16 object-cover rounded-lg" />
                                    <div className="flex-1">
                                        <h4 className="font-semibold">{post.title}</h4>
                                        <p className="text-sm text-gray-500">{post.category} • {post.date}</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const postToRemove = featuredPosts.find(p => p.id === post.id);
                                            setFeaturedPosts(featuredPosts.filter(p => p.id !== post.id));
                                            if (postToRemove) {
                                                setAvailablePosts(prev => [...prev, postToRemove]);
                                            }
                                        }}
                                        className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 p-2 rounded-lg"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Available Posts */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-xl font-bold mb-4">Add from All Posts</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                        {availablePosts.map(post => (
                            <div
                                key={post.id}
                                className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer group"
                                onClick={() => {
                                    if (featuredPosts.length >= 3) {
                                        alert('Maximum 3 posts allowed. Remove one first.');
                                        return;
                                    }
                                    setFeaturedPosts([...featuredPosts, post]);
                                    setAvailablePosts(availablePosts.filter(p => p.id !== post.id));
                                }}
                            >
                                <Plus className="text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <img src={post.coverImage} className="w-12 h-12 rounded object-cover" />
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium truncate">{post.title}</h4>
                                    <p className="text-xs text-gray-500">{post.date}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
