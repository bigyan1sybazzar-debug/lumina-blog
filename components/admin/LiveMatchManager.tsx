import React, { useState } from 'react';
import { Trophy, Plus, Trash2, Power, ExternalLink, Upload, Loader2 } from 'lucide-react';
import { LiveMatch } from '../../types';

interface LiveMatchManagerProps {
    matches: LiveMatch[];
    onCreateMatch: (match: Omit<LiveMatch, 'id' | 'createdAt'>) => Promise<void>;
    onUpdateStatus: (id: string, isActive: boolean) => Promise<void>;
    onDeleteMatch: (id: string) => Promise<void>;
}

export const LiveMatchManager: React.FC<LiveMatchManagerProps> = ({ matches, onCreateMatch, onUpdateStatus, onDeleteMatch }) => {
    const [title, setTitle] = useState('');
    const [team1, setTeam1] = useState('');
    const [team2, setTeam2] = useState('');
    const [matchUrl, setMatchUrl] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    const handleCreate = async () => {
        if (!title || !matchUrl) {
            alert('Title and Live URL are required');
            return;
        }
        await onCreateMatch({ title, team1, team2, matchUrl, isActive: true });
        setTitle('');
        setTeam1('');
        setTeam2('');
        setMatchUrl('');
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-primary-600 dark:text-primary-400">
                    <Trophy size={20} />
                    Create Live Match Notification
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Main Title (Required)
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. ICC World Cup 2024"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="input-field"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Live URL (Required)
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="https://example.com/live"
                                value={matchUrl}
                                onChange={(e) => setMatchUrl(e.target.value)}
                                className="input-field flex-1"
                            />
                            <label className="flex items-center justify-center px-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors" title="Upload File">
                                {isUploading ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} className="text-gray-500 dark:text-gray-400" />}
                                <input
                                    type="file"
                                    className="hidden"
                                    disabled={isUploading}
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;

                                        try {
                                            setIsUploading(true);
                                            const filename = encodeURIComponent(file.name);
                                            const res = await fetch(`/api/upload?filename=${filename}`, {
                                                method: 'POST',
                                                body: file,
                                            });

                                            if (!res.ok) throw new Error('Upload failed');

                                            const data = await res.json();
                                            setMatchUrl(data.url);
                                        } catch (error) {
                                            console.error('Upload error:', error);
                                            alert('Failed to upload file.');
                                        } finally {
                                            setIsUploading(false);
                                        }
                                    }}
                                />
                            </label>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Team 1 (Optional)
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. Brazil"
                            value={team1}
                            onChange={(e) => setTeam1(e.target.value)}
                            className="input-field"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Team 2 (Optional)
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. Argentina"
                            value={team2}
                            onChange={(e) => setTeam2(e.target.value)}
                            className="input-field"
                        />
                    </div>
                </div>
                <button
                    onClick={handleCreate}
                    className="mt-4 w-full bg-primary-600 text-white rounded-lg px-4 py-2 font-medium hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                >
                    <Plus size={18} />
                    Add Live Match
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                    <h3 className="font-bold text-gray-900 dark:text-white">Active Notifications</h3>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {matches.map((match) => (
                        <div key={match.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`w-2 h-2 rounded-full ${match.isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                                    <h4 className="font-bold text-gray-900 dark:text-white">{match.title}</h4>
                                </div>
                                {match.team1 && match.team2 && (
                                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                                        <span className="font-medium text-primary-600">{match.team1}</span>
                                        <span>vs</span>
                                        <span className="font-medium text-primary-600">{match.team2}</span>
                                    </div>
                                )}
                                <div className="mt-1">
                                    <a href={match.matchUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                                        <ExternalLink size={10} />
                                        {match.matchUrl}
                                    </a>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => onUpdateStatus(match.id, !match.isActive)}
                                    className={`p-2 rounded-lg transition-colors ${match.isActive ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                    title={match.isActive ? 'Deactivate' : 'Activate'}
                                >
                                    <Power size={18} />
                                </button>
                                <button
                                    onClick={() => onDeleteMatch(match.id)}
                                    className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {matches.length === 0 && (
                        <div className="p-8 text-center text-gray-500 italic">
                            No live match notifications configured.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
