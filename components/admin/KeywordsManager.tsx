import React, { useState } from 'react';
import { Tag, Plus, Trash2 } from 'lucide-react';
import { Keyword } from '../../types';

interface KeywordsManagerProps {
    keywords: Keyword[];
    onCreateKeyword: (name: string) => Promise<void>;
    onDeleteKeyword: (id: string) => Promise<void>;
}

export const KeywordsManager: React.FC<KeywordsManagerProps> = ({ keywords, onCreateKeyword, onDeleteKeyword }) => {
    const [newKeywordName, setNewKeywordName] = useState('');

    const handleCreate = async () => {
        if (!newKeywordName.trim()) {
            alert('Please enter a keyword.');
            return;
        }
        await onCreateKeyword(newKeywordName);
        setNewKeywordName('');
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Plus className="text-green-500" />
                    Add New Keyword
                </h2>
                <div className="flex gap-4">
                    <input
                        type="text"
                        placeholder="Keyword"
                        value={newKeywordName}
                        onChange={(e) => setNewKeywordName(e.target.value)}
                        className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg p-2 dark:bg-gray-700 bg-white"
                        onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                    />
                    <button
                        onClick={handleCreate}
                        className="bg-green-600 text-white rounded-lg px-4 py-2 font-medium hover:bg-green-700 transition-colors"
                    >
                        Add
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {keywords.map((keyword) => (
                            <tr key={keyword.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                    <Tag size={14} className="text-gray-400" />
                                    {keyword.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                    <button
                                        onClick={() => onDeleteKeyword(keyword.id)}
                                        className="text-red-500 hover:text-red-700 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {keywords.length === 0 && (
                            <tr>
                                <td colSpan={2} className="px-6 py-8 text-center text-gray-500">
                                    No keywords found. Add some above.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
