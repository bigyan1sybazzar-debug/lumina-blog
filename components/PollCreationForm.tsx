'use client';

import React, { useState, useRef } from 'react';
import { Image, Plus, Trash2, Loader2, Send, CheckCircle2 } from 'lucide-react';
import { createPoll } from '../services/db';
import { PollOption } from '../types';

interface PollCreationFormProps {
    onSuccess?: () => void;
}

const PollCreationForm: React.FC<PollCreationFormProps> = ({ onSuccess }) => {
    const [question, setQuestion] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState<'election' | 'movies' | 'gadgets' | 'other'>('other');
    const [options, setOptions] = useState<Partial<PollOption>[]>([
        { id: '1', text: '', votes: 0 },
        { id: '2', text: '', votes: 0 }
    ]);
    const [questionImage, setQuestionImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleUpload = async (file: File) => {
        const response = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
            method: 'POST',
            body: file,
        });
        if (!response.ok) throw new Error('Upload failed');
        const blob = await response.json();
        return blob.url;
    };

    const addOption = () => {
        setOptions([...options, { id: Date.now().toString(), text: '', votes: 0 }]);
    };

    const removeOption = (index: number) => {
        if (options.length <= 2) return;
        setOptions(options.filter((_, i) => i !== index));
    };

    const handleOptionChange = (index: number, text: string) => {
        const newOptions = [...options];
        newOptions[index].text = text;
        setOptions(newOptions);
    };

    const handleOptionImageUpload = async (index: number, file: File) => {
        try {
            const url = await handleUpload(file);
            const newOptions = [...options];
            newOptions[index].image = url;
            setOptions(newOptions);
        } catch (err) {
            alert('Failed to upload image');
        }
    };

    const handleQuestionImageUpload = async (file: File) => {
        try {
            const url = await handleUpload(file);
            setQuestionImage(url);
        } catch (err) {
            alert('Failed to upload question image');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!question || options.some(opt => !opt.text)) {
            alert('Please fill in all required fields');
            return;
        }

        setLoading(true);
        try {
            await createPoll({
                question,
                description,
                questionImage: questionImage || undefined,
                category,
                options: options as PollOption[],
            });
            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                setQuestion('');
                setDescription('');
                setQuestionImage(null);
                setOptions([{ id: '1', text: '', votes: 0 }, { id: '2', text: '', votes: 0 }]);
                if (onSuccess) onSuccess();
            }, 2000);
        } catch (err) {
            console.error(err);
            alert('Failed to create poll');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-[#161b22] border border-gray-800 rounded-[2.5rem] p-8 md:p-10 shadow-2xl mb-12 border-orange-500/20">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-orange-500/10 rounded-2xl text-orange-500">
                    <Plus size={24} />
                </div>
                <h2 className="text-3xl font-black text-white tracking-tight">Create a New Poll</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2">Question *</label>
                    <input
                        type="text"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        className="w-full bg-black/40 border-2 border-gray-800 rounded-2xl px-6 py-4 text-white outline-none focus:border-orange-500 transition-all font-bold placeholder-gray-700"
                        placeholder="What would you like to ask?"
                        required
                    />
                </div>

                <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2">Description (Optional)</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full bg-black/40 border-2 border-gray-800 rounded-2xl px-6 py-4 text-white outline-none focus:border-orange-500 transition-all font-medium placeholder-gray-700 resize-none h-24"
                        placeholder="Add some context..."
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2">Category *</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value as any)}
                            className="w-full bg-black/40 border-2 border-gray-800 rounded-2xl px-6 py-4 text-white outline-none focus:border-orange-500 transition-all font-bold appearance-none"
                        >
                            <option value="other">Other</option>
                            <option value="election">Election</option>
                            <option value="movies">Movies</option>
                            <option value="gadgets">Gadgets</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2">Question Header Image</label>
                        <div className="flex items-center gap-4">
                            <label className="flex-1 cursor-pointer group">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => e.target.files?.[0] && handleQuestionImageUpload(e.target.files[0])}
                                    className="hidden"
                                />
                                <div className="flex items-center justify-center gap-2 bg-gray-800/50 border-2 border-dashed border-gray-800 rounded-2xl px-6 py-4 text-gray-400 group-hover:border-orange-500/50 group-hover:text-orange-400 transition-all">
                                    <Image size={18} />
                                    <span className="text-xs font-bold uppercase tracking-widest truncate max-w-[150px]">
                                        {questionImage ? 'Change Image' : 'Upload Image'}
                                    </span>
                                </div>
                            </label>
                            {questionImage && (
                                <div className="w-14 h-14 rounded-xl overflow-hidden border border-gray-800 shadow-xl">
                                    <img src={questionImage} alt="Preview" className="w-full h-full object-cover" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Poll Options *</label>
                    <div className="grid grid-cols-1 gap-4">
                        {options.map((opt, index) => (
                            <div key={opt.id} className="flex gap-4 items-start">
                                <div className="flex-1 space-y-2">
                                    <input
                                        type="text"
                                        value={opt.text}
                                        onChange={(e) => handleOptionChange(index, e.target.value)}
                                        className="w-full bg-black/40 border-2 border-gray-800 rounded-2xl px-6 py-3 text-white outline-none focus:border-orange-500 transition-all font-bold placeholder-gray-700"
                                        placeholder={`Option ${index + 1}`}
                                        required
                                    />
                                    <div className="flex items-center gap-3">
                                        <label className="cursor-pointer group">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => e.target.files?.[0] && handleOptionImageUpload(index, e.target.files[0])}
                                                className="hidden"
                                            />
                                            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-gray-500 group-hover:text-orange-400 transition-colors">
                                                <Image size={14} />
                                                {opt.image ? 'Replace Image' : 'Add Image'}
                                            </div>
                                        </label>
                                        {opt.image && (
                                            <div className="w-6 h-6 rounded-md overflow-hidden border border-gray-800">
                                                <img src={opt.image} alt="Preview" className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeOption(index)}
                                    className="p-4 rounded-2xl bg-gray-800/50 text-gray-500 hover:text-red-500 transition-all"
                                    disabled={options.length <= 2}
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={addOption}
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-orange-500 hover:text-orange-400 transition-colors py-2"
                    >
                        <Plus size={16} /> Add Another Option
                    </button>
                </div>

                <div className="pt-6 border-t border-gray-800/50">
                    <button
                        type="submit"
                        disabled={loading || success}
                        className={`w-full h-16 rounded-3xl font-black text-sm uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-4 ${success
                                ? 'bg-green-600 text-white'
                                : 'bg-orange-600 text-white hover:bg-orange-500 shadow-xl shadow-orange-900/20 active:scale-[0.98]'
                            }`}
                    >
                        {loading ? (
                            <Loader2 className="animate-spin" />
                        ) : success ? (
                            <>
                                <CheckCircle2 /> Poll Created!
                            </>
                        ) : (
                            <>
                                <Send size={20} /> Launch Poll
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PollCreationForm;
