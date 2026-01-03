import React, { useState } from 'react';
import { Tag, Plus, Trash2 } from 'lucide-react';
import { Category } from '../../types';

interface CategoriesManagerProps {
    categories: Category[];
    onCreateCategory: (name: string, description: string, icon: string) => Promise<void>;
    onDeleteCategory: (id: string) => Promise<void>;
}

export const CategoriesManager: React.FC<CategoriesManagerProps> = ({ categories, onCreateCategory, onDeleteCategory }) => {
    const [newCatName, setNewCatName] = useState('');
    const [newCatDesc, setNewCatDesc] = useState('');
    const [newCatIcon, setNewCatIcon] = useState('Tag');

    const handleCreate = async () => {
        if (!newCatName.trim()) {
            alert('Please enter a category name.');
            return;
        }
        await onCreateCategory(newCatName, newCatDesc, newCatIcon);
        setNewCatName('');
        setNewCatDesc('');
        setNewCatIcon('Tag'); // Reset
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Plus className="text-green-500" />
                    Create New Category
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                        type="text"
                        placeholder="Category Name"
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 dark:bg-gray-700 bg-white"
                    />
                    <input
                        type="text"
                        placeholder="Description (Optional)"
                        value={newCatDesc}
                        onChange={(e) => setNewCatDesc(e.target.value)}
                        className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 dark:bg-gray-700 bg-white"
                    />
                    <button
                        onClick={handleCreate}
                        className="bg-green-600 text-white rounded-lg p-2 font-medium hover:bg-green-700 transition-colors"
                    >
                        Create Category
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Icon</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {categories.map((cat) => (
                            <tr key={cat.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="px-6 py-4 whitespace-nowrap text-gray-500"><Tag size={16} /></td>
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white">{cat.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                    <button
                                        onClick={() => onDeleteCategory(cat.id)}
                                        className="text-red-500 hover:text-red-700 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
