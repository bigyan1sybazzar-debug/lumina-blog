import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    createPost, updatePost, getPostById, getCategories
} from '../services/db';
import { generateBlogOutline, generateFullPost } from '../services/geminiService';
import {
    Loader2, Save, PenTool, Sparkles, ArrowLeft, RefreshCw, Eye
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Category, BlogPost } from '../types';
import { Header } from '../components/Header';
import Head from 'next/head';

export default function WritePage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams?.get('edit');

    // State
    const [title, setTitle] = useState('');
    const [slug, setSlug] = useState('');
    const [fullContent, setFullContent] = useState('');
    const [excerpt, setExcerpt] = useState('');
    const [category, setCategory] = useState('');
    const [categories, setCategories] = useState<Category[]>([]);
    const [tagsInput, setTagsInput] = useState('');
    const [coverImage, setCoverImage] = useState('https://picsum.photos/800/400?random=1');
    const [coverImageAlt, setCoverImageAlt] = useState('');

    // Editor State
    const [editorMode, setEditorMode] = useState<'ai' | 'manual'>('manual');
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [isSaving, setIsSaving] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    // AI State
    const [topic, setTopic] = useState('');
    const [outline, setOutline] = useState('');

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login');
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        const fetchDeps = async () => {
            const cats = await getCategories();
            setCategories(cats);
            if (cats.length > 0) setCategory(cats[0].name);
        };
        fetchDeps();
    }, []);

    useEffect(() => {
        if (editId) {
            const loadPost = async () => {
                const post = await getPostById(editId);
                if (post) {
                    setTitle(post.title);
                    setSlug(post.slug || '');
                    setFullContent(post.content);
                    setExcerpt(post.excerpt || '');
                    setCategory(post.category);
                    setTagsInput(post.tags?.join(', ') || '');
                    setCoverImage(post.coverImage);
                    // setCoverImageAlt(post.imageAlt || '');
                }
            };
            loadPost();
        }
    }, [editId]);

    const setRandomImage = () => {
        setCoverImage(`https://picsum.photos/800/400?random=${Date.now()}`);
    };

    // --- AI HANDLERS ---
    const handleGenerateOutline = async () => {
        if (!topic.trim()) return;
        setIsGenerating(true);
        try {
            const result = await generateBlogOutline(topic);
            setOutline(result);
            setStep(2);
        } catch (error) {
            alert('AI generation failed. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGenerateFull = async () => {
        if (!outline.trim()) return;
        setIsGenerating(true);
        try {
            const content = await generateFullPost(title || topic, outline);
            setFullContent(content);
            setStep(3);
        } catch (error) {
            alert('Full post generation failed.');
        } finally {
            setIsGenerating(false);
        }
    };

    // --- SAVE HANDLER ---
    const handleSavePost = async () => {
        if (!user || !title || !fullContent) return;
        setIsSaving(true);

        const isAdmin = user.role === 'admin';
        const status = isAdmin ? 'published' : 'pending';

        const finalSlug = slug.trim() || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        const postData = {
            title,
            slug: finalSlug,
            content: fullContent,
            excerpt,
            category: category || 'General',
            tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean),
            coverImage,
            coverImageAlt: coverImageAlt,
            status: status as 'published' | 'pending' | 'draft',
            authorId: user.id,
            author: {
                name: user.name,
                avatar: user.avatar,
                id: user.id
            },
            date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
            readTime: `${Math.max(1, Math.ceil(fullContent.split(/\s+/).length / 200))} min read`
        };

        try {
            if (editId) {
                // For update, we want to update the timestamp
                // updatePost handles updatedAt internally
                await updatePost(editId, postData);
                alert('Post updated successfully!');
            } else {
                // createPost handles createdAt, updatedAt, views, and likes internally
                await createPost({
                    ...postData
                });
                alert(isAdmin ? 'Post published successfully!' : 'Post submitted for review!');
            }
            router.push('/profile?tab=posts');
        } catch (error) {
            console.error('Save failed', error);
            alert('Failed to save post.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading || !user) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans">
            <Head>
                <title>{editId ? 'Edit Post' : 'New Post'} | Bigyann</title>
            </Head>
            <Header />

            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            {editorMode === 'ai' ? <Sparkles className="text-primary-500" /> : <PenTool className="text-green-500" />}
                            {editId ? 'Edit Post' : 'Create New Post'}
                        </h1>
                        <p className="text-gray-500 mt-1">
                            {user.role === 'admin' ? 'Create and publish content.' : 'Submit your article for review.'}
                        </p>
                    </div>
                    <div className="flex bg-white dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700">
                        <button
                            onClick={() => { setEditorMode('manual'); setStep(3) }}
                            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${editorMode === 'manual' ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-500'}`}
                        >
                            Manual
                        </button>
                        <button
                            onClick={() => { setEditorMode('ai'); setStep(1) }}
                            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${editorMode === 'ai' ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600' : 'text-gray-500'}`}
                        >
                            <Sparkles size={14} className="inline mr-1" /> AI Assist
                        </button>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xl p-8">

                    {/* AI MODE */}
                    {editorMode === 'ai' && (
                        <div className="space-y-8 animate-in fade-in duration-500">
                            {/* Step 1 */}
                            {step === 1 && (
                                <div className="max-w-2xl mx-auto text-center space-y-6 py-10">
                                    <Sparkles size={48} className="mx-auto text-primary-500 mb-4" />
                                    <h2 className="text-2xl font-bold dark:text-white">What shall we write about today?</h2>
                                    <div className="flex gap-2">
                                        <input
                                            value={topic}
                                            onChange={(e) => setTopic(e.target.value)}
                                            placeholder="e.g., The Future of Quantum Computing..."
                                            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                        />
                                        <button
                                            onClick={handleGenerateOutline}
                                            disabled={isGenerating || !topic}
                                            className="px-6 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
                                        >
                                            {isGenerating ? <Loader2 className="animate-spin" /> : 'Generate'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Step 2 */}
                            {step === 2 && (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center">
                                        <h2 className="text-xl font-bold dark:text-white">Refine Outline</h2>
                                        <button onClick={() => setStep(1)} className="text-sm text-gray-500 hover:text-primary-600 flex items-center"><ArrowLeft size={14} className="mr-1" /> Back</button>
                                    </div>
                                    <input
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Post Title"
                                        className="w-full px-4 py-3 text-lg font-bold rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    />
                                    <textarea
                                        value={outline}
                                        onChange={(e) => setOutline(e.target.value)}
                                        className="w-full h-64 px-4 py-3 font-mono text-sm rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    />
                                    <button
                                        onClick={handleGenerateFull}
                                        disabled={isGenerating}
                                        className="w-full py-4 bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg transition-all"
                                    >
                                        {isGenerating ? <span className="flex items-center justify-center gap-2"><Loader2 className="animate-spin" /> Writing Magic...</span> : <span className="flex items-center justify-center gap-2"><Sparkles /> Generate Full Article</span>}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* MANUAL / FINAL EDIT MODE */}
                    {(editorMode === 'manual' || step === 3) && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Editor Column */}
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Title</label>
                                    <input
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="w-full px-4 py-3 text-lg font-bold rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                                        placeholder="Article Title"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Category</label>
                                        <select
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white outline-none"
                                        >
                                            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Tags</label>
                                        <input
                                            value={tagsInput}
                                            onChange={(e) => setTagsInput(e.target.value)}
                                            placeholder="tech, code, life"
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Cover Image</label>
                                    <div className="flex gap-2">
                                        <input
                                            value={coverImage}
                                            onChange={(e) => setCoverImage(e.target.value)}
                                            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white outline-none"
                                            placeholder="Image URL"
                                        />
                                        <button onClick={setRandomImage} className="px-4 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300"><RefreshCw size={18} /></button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                        Content (Markdown)
                                        <span className="ml-2 text-xs font-normal text-gray-400">Supports HTML & Markdown</span>
                                    </label>
                                    <textarea
                                        value={fullContent}
                                        onChange={(e) => setFullContent(e.target.value)}
                                        className="w-full h-[500px] px-4 py-4 font-mono text-sm rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white outline-none focus:border-primary-500"
                                        placeholder="Start writing..."
                                    />
                                </div>
                            </div>

                            {/* Preview Column */}
                            <div className="space-y-6">
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2"><Eye size={16} /> Live Preview</label>
                                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-8 h-[calc(100%-2rem)] overflow-y-auto">
                                    <img src={coverImage} className="w-full h-48 object-cover rounded-xl mb-6 shadow-sm" alt="Preview" />
                                    <h1 className="text-3xl font-black mb-4 dark:text-white">{title || 'Untitled Post'}</h1>
                                    <div className="prose dark:prose-invert max-w-none">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                                            {fullContent || '_Preview will appear here..._'}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            </div>

                            {/* Actions Footer */}
                            <div className="col-span-1 lg:col-span-2 pt-6 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-4">
                                <button
                                    onClick={() => router.back()}
                                    className="px-6 py-3 font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSavePost}
                                    disabled={isSaving || !title.trim() || !fullContent.trim()}
                                    className="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-lg shadow-primary-600/20 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isSaving ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                                    {editId ? 'Update Post' : user.role === 'admin' ? 'Publish Now' : 'Submit for Review'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
