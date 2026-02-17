'use client';

import React, { useState } from 'react';
import { Image, Plus, Trash2, Loader2, Send, CheckCircle2, Link as LinkIcon } from 'lucide-react';
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
    const [questionImage, setQuestionImage] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

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

    const handleOptionImageUrlChange = (index: number, url: string) => {
        const newOptions = [...options];
        newOptions[index].image = url;
        setOptions(newOptions);
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
                setQuestionImage('');
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
        <div className="bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700 rounded-[2.5rem] md:rounded-[4rem] p-8 md:p-16 shadow-xl mb-24 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-12 text-primary-500/5 pointer-events-none">
                <Plus size={200} strokeWidth={4} />
            </div>

            <div className="relative z-10">
                <div className="flex flex-col md:flex-row md:items-center gap-6 mb-12">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-primary-600 rounded-3xl flex items-center justify-center text-white shadow-lg">
                        <Plus className="w-10 h-10 md:w-12 md:h-12" strokeWidth={4} />
                    </div>
                    <h2 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white tracking-tight">Launch a <span className="text-primary-600 italic">Poll</span></h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8 md:space-y-12">
                    <div className="group/field">
                        <label className="block text-[10px] md:text-xs font-bold uppercase tracking-widest text-primary-500/60 mb-4 group-focus-within/field:text-primary-500 transition-colors">The Main Question</label>
                        <input
                            type="text"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            className="w-full bg-transparent border-b-4 border-gray-100 dark:border-gray-700 focus:border-primary-500 text-3xl md:text-5xl text-gray-900 dark:text-white outline-none transition-all font-black tracking-tight placeholder:text-gray-300 dark:placeholder:text-gray-600 pb-4"
                            placeholder="WHAT'S ON YOUR MIND?"
                            required
                        />
                    </div>

                    <div className="group/field">
                        <label className="block text-[10px] md:text-xs font-bold uppercase tracking-widest text-primary-500/60 mb-4">Add Context</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 focus:border-primary-500/50 rounded-2xl p-6 text-gray-900 dark:text-white outline-none transition-all font-medium text-lg placeholder:text-gray-400 h-32"
                            placeholder="Share some details..."
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="group/field">
                            <label className="block text-[10px] md:text-xs font-bold uppercase tracking-widest text-primary-500/60 mb-4">Category</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value as any)}
                                className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 focus:border-primary-500/50 rounded-2xl p-4 text-gray-900 dark:text-white outline-none transition-all font-bold text-lg appearance-none cursor-pointer"
                            >
                                <option value="other">OTHER</option>
                                <option value="election">POLITICS</option>
                                <option value="movies">CINEMA</option>
                                <option value="gadgets">TECH</option>
                            </select>
                        </div>

                        <div className="group/field">
                            <label className="block text-[10px] md:text-xs font-bold uppercase tracking-widest text-primary-500/60 mb-4">Cover Image URL</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={questionImage}
                                    onChange={(e) => setQuestionImage(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 focus:border-primary-500/50 rounded-2xl pl-12 pr-12 py-4 text-gray-900 dark:text-white outline-none transition-all font-medium text-lg placeholder:text-gray-400"
                                    placeholder="Paste image URL..."
                                />
                                <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-500" size={20} />
                                {questionImage && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl overflow-hidden border border-primary-500/30">
                                        <img src={questionImage} alt="Preview" className="w-full h-full object-cover" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <label className="block text-[10px] md:text-xs font-bold uppercase tracking-widest text-primary-500/60">Poll Choices</label>
                        <div className="grid grid-cols-1 gap-4">
                            {options.map((opt, index) => (
                                <div key={opt.id} className="flex flex-col md:flex-row gap-4 items-stretch md:items-center bg-gray-50 dark:bg-gray-900/50 p-4 md:p-6 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-primary-500/20 transition-all">
                                    <div className="flex-1 space-y-3">
                                        <input
                                            type="text"
                                            value={opt.text}
                                            onChange={(e) => handleOptionChange(index, e.target.value)}
                                            className="w-full bg-transparent border-b-2 border-gray-200 dark:border-gray-700 focus:border-primary-500 text-xl font-bold text-gray-900 dark:text-white outline-none transition-all placeholder:text-gray-300 dark:placeholder:text-gray-600"
                                            placeholder={`Option ${index + 1}`}
                                            required
                                        />
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={opt.image || ''}
                                                onChange={(e) => handleOptionImageUrlChange(index, e.target.value)}
                                                className="w-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 focus:border-primary-500/30 rounded-xl pl-10 pr-10 py-2.5 text-xs text-gray-500 outline-none transition-all"
                                                placeholder="Choice Image URL (Optional)"
                                            />
                                            <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary-500/40" size={14} />
                                            {opt.image && (
                                                <div className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg overflow-hidden border border-primary-500/20">
                                                    <img src={opt.image} alt="Preview" className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeOption(index)}
                                        className="p-4 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all self-center md:self-stretch flex items-center justify-center"
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
                            className="w-full md:w-auto px-8 py-3.5 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-bold uppercase tracking-widest text-[10px] hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-all flex items-center justify-center gap-3 group/add"
                        >
                            <Plus size={16} className="group-hover/add:rotate-90 transition-transform" /> Add Choice
                        </button>
                    </div>

                    <div className="pt-12">
                        <button
                            type="submit"
                            disabled={loading || success}
                            className={`w-full h-20 md:h-24 rounded-2xl md:rounded-3xl font-black text-xl md:text-3xl uppercase tracking-widest transition-all flex items-center justify-center gap-6 shadow-lg ${success
                                ? 'bg-green-500 text-white'
                                : 'bg-primary-600 text-white hover:bg-primary-700 hover:-translate-y-1 active:scale-[0.98] shadow-primary-500/30'
                                }`}
                        >
                            {loading ? (
                                <Loader2 className="animate-spin w-8 h-8 md:w-12 md:h-12" strokeWidth={4} />
                            ) : success ? (
                                <>
                                    <CheckCircle2 size={32} strokeWidth={4} /> LIVE!
                                </>
                            ) : (
                                <>
                                    <Send className="w-6 h-6 md:w-8 md:h-8" strokeWidth={4} /> LAUNCH POLL
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PollCreationForm;
