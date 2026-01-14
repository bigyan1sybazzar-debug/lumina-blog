'use client';

import React, { useState, useEffect } from 'react';
import { Prompt, PromptCategory, PromptSubcategory } from '../../types';
import {
    getPrompts,
    getPromptCategories,
    getPromptSubcategories,
    addPrompt,
    updatePrompt,
    deletePrompt,
    approvePrompt,
    rejectPrompt,
    addPromptCategory,
    addPromptSubcategory,
    deletePromptCategory,
    deletePromptSubcategory
} from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { Plus, Edit, Trash2, Check, X, Sparkles } from 'lucide-react';

export const PromptManager: React.FC = () => {
    const { user } = useAuth();
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [categories, setCategories] = useState<PromptCategory[]>([]);
    const [subcategories, setSubcategories] = useState<PromptSubcategory[]>([]);
    const [activeTab, setActiveTab] = useState<'prompts' | 'categories' | 'subcategories'>('prompts');
    const [showAddPrompt, setShowAddPrompt] = useState(false);
    const [showAddCategory, setShowAddCategory] = useState(false);
    const [showAddSubcategory, setShowAddSubcategory] = useState(false);

    // Form states
    const [newPrompt, setNewPrompt] = useState({
        title: '',
        description: '',
        content: '',
        categoryId: '',
        subcategoryId: '',
        tags: '',
        isFeatured: false
    });

    const [newCategory, setNewCategory] = useState({
        name: '',
        icon: '',
        description: '',
        order: 0
    });

    const [newSubcategory, setNewSubcategory] = useState({
        name: '',
        description: '',
        categoryId: '',
        order: 0
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [promptsData, catsData, subcatsData] = await Promise.all([
                getPrompts(),
                getPromptCategories(),
                getPromptSubcategories()
            ]);
            setPrompts(promptsData);
            setCategories(catsData);
            setSubcategories(subcatsData);
        } catch (error) {
            console.error('Error loading data:', error);
        }
    };

    const handleAddPrompt = async () => {
        if (!user || !newPrompt.title || !newPrompt.content || !newPrompt.categoryId || !newPrompt.subcategoryId) {
            alert('Please fill in all required fields');
            return;
        }

        try {
            const category = categories.find(c => c.id === newPrompt.categoryId);
            const subcategory = subcategories.find(s => s.id === newPrompt.subcategoryId);

            await addPrompt({
                ...newPrompt,
                categoryName: category?.name || '',
                subcategoryName: subcategory?.name || '',
                tags: newPrompt.tags.split(',').map(t => t.trim()).filter(Boolean),
                author: {
                    id: user.id,
                    name: user.name,
                    avatar: user.avatar
                },
                status: (user.role === 'admin' || user.role === 'editor') ? 'approved' : 'pending'
            });

            alert('Prompt added successfully!');
            setShowAddPrompt(false);
            setNewPrompt({
                title: '',
                description: '',
                content: '',
                categoryId: '',
                subcategoryId: '',
                tags: '',
                isFeatured: false
            });
            loadData();
        } catch (error) {
            console.error('Error adding prompt:', error);
            alert('Failed to add prompt');
        }
    };

    const handleAddCategory = async () => {
        if (!newCategory.name || !newCategory.icon) {
            alert('Please fill in all required fields');
            return;
        }

        try {
            await addPromptCategory(newCategory);
            alert('Category added successfully!');
            setShowAddCategory(false);
            setNewCategory({ name: '', icon: '', description: '', order: 0 });
            loadData();
        } catch (error) {
            console.error('Error adding category:', error);
            alert('Failed to add category');
        }
    };

    const handleAddSubcategory = async () => {
        if (!newSubcategory.name || !newSubcategory.categoryId) {
            alert('Please fill in all required fields');
            return;
        }

        try {
            await addPromptSubcategory(newSubcategory);
            alert('Subcategory added successfully!');
            setShowAddSubcategory(false);
            setNewSubcategory({ name: '', description: '', categoryId: '', order: 0 });
            loadData();
        } catch (error) {
            console.error('Error adding subcategory:', error);
            alert('Failed to add subcategory');
        }
    };

    const handleApprove = async (id: string) => {
        try {
            await approvePrompt(id);
            loadData();
        } catch (error) {
            console.error('Error approving prompt:', error);
        }
    };

    const handleReject = async (id: string) => {
        try {
            await rejectPrompt(id);
            loadData();
        } catch (error) {
            console.error('Error rejecting prompt:', error);
        }
    };

    const handleDeletePrompt = async (id: string) => {
        if (!confirm('Are you sure you want to delete this prompt?')) return;

        try {
            await deletePrompt(id);
            loadData();
        } catch (error) {
            console.error('Error deleting prompt:', error);
            alert('Failed to delete prompt');
        }
    };

    const handleDeleteCategory = async (id: string) => {
        if (!confirm('Are you sure? This will fail if prompts/subcategories use this category.')) return;

        try {
            await deletePromptCategory(id);
            loadData();
        } catch (error: any) {
            alert(error.message || 'Failed to delete category');
        }
    };

    const handleDeleteSubcategory = async (id: string) => {
        if (!confirm('Are you sure? This will fail if prompts use this subcategory.')) return;

        try {
            await deletePromptSubcategory(id);
            loadData();
        } catch (error: any) {
            alert(error.message || 'Failed to delete subcategory');
        }
    };

    const pendingPrompts = prompts.filter(p => p.status === 'pending');
    const approvedPrompts = prompts.filter(p => p.status === 'approved');

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="text-primary-600" />
                    Prompts Management
                </h2>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => setActiveTab('prompts')}
                    className={`px-4 py-2 font-medium transition-colors ${activeTab === 'prompts'
                        ? 'text-primary-600 border-b-2 border-primary-600'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                >
                    Prompts ({prompts.length})
                </button>
                <button
                    onClick={() => setActiveTab('categories')}
                    className={`px-4 py-2 font-medium transition-colors ${activeTab === 'categories'
                        ? 'text-primary-600 border-b-2 border-primary-600'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                >
                    Categories ({categories.length})
                </button>
                <button
                    onClick={() => setActiveTab('subcategories')}
                    className={`px-4 py-2 font-medium transition-colors ${activeTab === 'subcategories'
                        ? 'text-primary-600 border-b-2 border-primary-600'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                >
                    Subcategories ({subcategories.length})
                </button>
            </div>

            {/* Prompts Tab */}
            {activeTab === 'prompts' && (
                <div className="space-y-6">
                    <button
                        onClick={() => setShowAddPrompt(!showAddPrompt)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                    >
                        <Plus size={20} />
                        Add New Prompt
                    </button>

                    {/* Add Prompt Form */}
                    {showAddPrompt && (
                        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 space-y-4">
                            <h3 className="font-bold text-lg">Add New Prompt</h3>

                            <input
                                type="text"
                                placeholder="Title *"
                                value={newPrompt.title}
                                onChange={(e) => setNewPrompt({ ...newPrompt, title: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            />

                            <textarea
                                placeholder="Description *"
                                value={newPrompt.description}
                                onChange={(e) => setNewPrompt({ ...newPrompt, description: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                rows={2}
                            />

                            <textarea
                                placeholder="Prompt Content *"
                                value={newPrompt.content}
                                onChange={(e) => setNewPrompt({ ...newPrompt, content: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono"
                                rows={4}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <select
                                    value={newPrompt.categoryId}
                                    onChange={(e) => setNewPrompt({ ...newPrompt, categoryId: e.target.value, subcategoryId: '' })}
                                    className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                >
                                    <option value="">Select Category *</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>

                                <select
                                    value={newPrompt.subcategoryId}
                                    onChange={(e) => setNewPrompt({ ...newPrompt, subcategoryId: e.target.value })}
                                    className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    disabled={!newPrompt.categoryId}
                                >
                                    <option value="">Select Subcategory *</option>
                                    {subcategories
                                        .filter(sub => sub.categoryId === newPrompt.categoryId)
                                        .map(sub => (
                                            <option key={sub.id} value={sub.id}>{sub.name}</option>
                                        ))}
                                </select>
                            </div>

                            <input
                                type="text"
                                placeholder="Tags (comma-separated)"
                                value={newPrompt.tags}
                                onChange={(e) => setNewPrompt({ ...newPrompt, tags: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            />

                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={newPrompt.isFeatured}
                                    onChange={(e) => setNewPrompt({ ...newPrompt, isFeatured: e.target.checked })}
                                    className="rounded"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">Featured Prompt</span>
                            </label>

                            <div className="flex gap-2">
                                <button
                                    onClick={handleAddPrompt}
                                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg"
                                >
                                    Add Prompt
                                </button>
                                <button
                                    onClick={() => setShowAddPrompt(false)}
                                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Pending Prompts */}
                    {pendingPrompts.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="font-bold text-lg text-orange-600 dark:text-orange-400">
                                Pending Approval ({pendingPrompts.length})
                            </h3>
                            {pendingPrompts.map(prompt => (
                                <div key={prompt.id} className="bg-orange-50 dark:bg-orange-900/10 rounded-xl p-4 border border-orange-200 dark:border-orange-900/30">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <h4 className="font-bold text-gray-900 dark:text-white">{prompt.title}</h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{prompt.description}</p>
                                            <div className="flex gap-2 mt-2">
                                                <span className="text-xs px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded">
                                                    {prompt.categoryName}
                                                </span>
                                                <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded">
                                                    {prompt.subcategoryName}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleApprove(prompt.id)}
                                                className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                                                title="Approve"
                                            >
                                                <Check size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleReject(prompt.id)}
                                                className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                                                title="Reject"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Approved Prompts */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-lg text-green-600 dark:text-green-400">
                            Approved Prompts ({approvedPrompts.length})
                        </h3>
                        {approvedPrompts.map(prompt => (
                            <div key={prompt.id} className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-bold text-gray-900 dark:text-white">{prompt.title}</h4>
                                            {prompt.isFeatured && (
                                                <span className="text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded">
                                                    ⭐ Featured
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{prompt.description}</p>
                                        <div className="flex gap-2 mt-2">
                                            <span className="text-xs px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded">
                                                {prompt.categoryName}
                                            </span>
                                            <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded">
                                                {prompt.subcategoryName}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                👤 {prompt.author.name} • 💖 {prompt.likes.length} • 📊 {prompt.usageCount}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDeletePrompt(prompt.id)}
                                        className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                                        title="Delete"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Categories Tab */}
            {activeTab === 'categories' && (
                <div className="space-y-6">
                    <button
                        onClick={() => setShowAddCategory(!showAddCategory)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                    >
                        <Plus size={20} />
                        Add Category
                    </button>

                    {showAddCategory && (
                        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 space-y-4">
                            <h3 className="font-bold text-lg">Add Category</h3>
                            <input
                                type="text"
                                placeholder="Name *"
                                value={newCategory.name}
                                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                            <input
                                type="text"
                                placeholder="Icon (optional emoji)"
                                value={newCategory.icon}
                                onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                            <textarea
                                placeholder="Description"
                                value={newCategory.description}
                                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                rows={2}
                            />
                            <input
                                type="number"
                                placeholder="Order"
                                value={newCategory.order}
                                onChange={(e) => setNewCategory({ ...newCategory, order: parseInt(e.target.value) })}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={handleAddCategory}
                                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg"
                                >
                                    Add Category
                                </button>
                                <button
                                    onClick={() => setShowAddCategory(false)}
                                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        {categories.map(cat => (
                            <div key={cat.id} className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 flex justify-between items-center">
                                <div>
                                    <h4 className="font-bold text-gray-900 dark:text-white">
                                        {cat.name}
                                    </h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{cat.description}</p>
                                    <span className="text-xs text-gray-500">Order: {cat.order}</span>
                                </div>
                                <button
                                    onClick={() => handleDeleteCategory(cat.id)}
                                    className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Subcategories Tab */}
            {activeTab === 'subcategories' && (
                <div className="space-y-6">
                    <button
                        onClick={() => setShowAddSubcategory(!showAddSubcategory)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                    >
                        <Plus size={20} />
                        Add Subcategory
                    </button>

                    {showAddSubcategory && (
                        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 space-y-4">
                            <h3 className="font-bold text-lg">Add Subcategory</h3>
                            <select
                                value={newSubcategory.categoryId}
                                onChange={(e) => setNewSubcategory({ ...newSubcategory, categoryId: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            >
                                <option value="">Select Category *</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                            <input
                                type="text"
                                placeholder="Name *"
                                value={newSubcategory.name}
                                onChange={(e) => setNewSubcategory({ ...newSubcategory, name: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                            <textarea
                                placeholder="Description"
                                value={newSubcategory.description}
                                onChange={(e) => setNewSubcategory({ ...newSubcategory, description: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                rows={2}
                            />
                            <input
                                type="number"
                                placeholder="Order"
                                value={newSubcategory.order}
                                onChange={(e) => setNewSubcategory({ ...newSubcategory, order: parseInt(e.target.value) })}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={handleAddSubcategory}
                                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg"
                                >
                                    Add Subcategory
                                </button>
                                <button
                                    onClick={() => setShowAddSubcategory(false)}
                                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        {subcategories.map(subcat => {
                            const category = categories.find(c => c.id === subcat.categoryId);
                            return (
                                <div key={subcat.id} className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 flex justify-between items-center">
                                    <div>
                                        <h4 className="font-bold text-gray-900 dark:text-white">{subcat.name}</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{subcat.description}</p>
                                        <span className="text-xs text-gray-500">
                                            Category: {category?.name} • Order: {subcat.order}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteSubcategory(subcat.id)}
                                        className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PromptManager;
