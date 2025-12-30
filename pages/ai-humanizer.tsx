import React, { useState, useCallback } from 'react';
import { Sparkles, Copy, AlertTriangle, CheckCircle, RefreshCw, Smartphone, Monitor, Upload, Download, FileText, X } from 'lucide-react';
import { analyzeAndHumanize } from '../services/geminiService';
import { PlagiarismAnalysisResult, HumanizerMode } from '../services/geminiService';
import Head from 'next/head';
import { useDropzone } from 'react-dropzone';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

const MAX_WORD_COUNT = 5000;

export default function AIHumanizer() {
    const [input, setInput] = useState('');
    const [result, setResult] = useState<PlagiarismAnalysisResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);
    const [wordCount, setWordCount] = useState(0);
    const [mode, setMode] = useState<HumanizerMode>('Standard');

    // Update word count on input change
    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const text = e.target.value;
        updateInput(text);
    };

    const updateInput = (text: string) => {
        setInput(text);
        setWordCount(text.trim().split(/\s+/).filter(w => w.length > 0).length);
        setError('');
    };

    // File Upload Handler
    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        if (file.name.endsWith('.docx')) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const arrayBuffer = e.target?.result as ArrayBuffer;
                    // Dynamic import for performance
                    const mammoth = await import('mammoth');
                    const result = await mammoth.extractRawText({ arrayBuffer });
                    updateInput(result.value);
                } catch (err) {
                    setError("Failed to read .docx file");
                }
            };
            reader.readAsArrayBuffer(file);
        } else if (file.type === 'text/plain') {
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target?.result as string;
                updateInput(text);
            };
            reader.readAsText(file);
        } else {
            setError("Unsupported file format. Please upload .docx or .txt");
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
        onDrop,
        accept: {
            'text/plain': ['.txt'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
        },
        maxFiles: 1,
        noClick: true // Important: Allows clicking textarea without opening file dialog
    });

    const handleAnalyze = async () => {
        if (!input.trim()) return;

        if (wordCount > MAX_WORD_COUNT) {
            setError(`Word limit exceeded! Max ${MAX_WORD_COUNT} words allowed. Current: ${wordCount}`);
            return;
        }

        setLoading(true);
        setError('');
        setResult(null);

        try {
            const response = await fetch('/api/ai-humanizer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: input, mode })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || "Analysis failed");
            }

            const data = await response.json();
            setResult(data);
        } catch (err: any) {
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        if (result?.humanized_text) {
            navigator.clipboard.writeText(result.humanized_text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleDownload = () => {
        if (!result?.humanized_text) return;
        const element = document.createElement("a");
        const file = new Blob([result.humanized_text], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = "humanized_text.txt";
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    const clearInput = () => {
        setInput('');
        setWordCount(0);
        setResult(null);
        setError('');
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans text-gray-900 dark:text-gray-100 transition-colors duration-300">
            <Head>
                <title>Premium AI Humanizer 2.0 | Bigyann</title>
                <meta name="description" content="Advanced 0% AI Detection Humanizer. Upload docs, wide layout, and professional results." />
            </Head>

            <Header />

            <main className="max-w-[95rem] mx-auto px-4 py-8 md:py-12 pt-24">

                {/* Header */}
                <div className="text-center mb-10 space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 text-purple-700 dark:text-purple-300 font-bold text-sm uppercase tracking-wider animate-in fade-in slide-in-from-top-4 duration-700">
                        <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        V2.0 Professional Edition
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 tracking-tight">
                        Undetectable AI.
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto font-light leading-relaxed">
                        Transform AI content into undetectable, human-written masterpieces.
                        <br />
                        <span className="text-sm font-semibold opacity-75 mt-2 block">Supports .docx / .txt • Max 5,000 Words</span>
                    </p>
                </div>

                {/* Main Interface */}
                <div className="grid lg:grid-cols-2 gap-6 h-[85vh] min-h-[600px]">

                    {/* Left: Input Section */}
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col h-full overflow-hidden transition-all hover:shadow-purple-500/10">

                        {/* Toolbar */}
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-bold uppercase text-gray-400 tracking-wider flex items-center gap-2">
                                    <FileText className="w-4 h-4" /> Input
                                </span>

                                {/* NEW: Mode Selector */}
                                <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-2"></div>
                                <select
                                    value={mode}
                                    onChange={(e) => setMode(e.target.value as HumanizerMode)}
                                    className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value="Standard">Standard</option>
                                    <option value="Academic">Academic / Research</option>
                                    <option value="Blog">Blog / SEO</option>
                                    <option value="Professional">Professional / Email</option>
                                    <option value="Creative">Creative / Story</option>
                                </select>

                                <button
                                    onClick={open}
                                    className="px-3 py-1.5 bg-white dark:bg-gray-800 text-xs font-bold text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-all shadow-sm ml-2"
                                    title="Upload .docx or .txt"
                                >
                                    <Upload className="w-3.5 h-3.5" /> Upload
                                </button>
                            </div>
                            <div className="flex items-center gap-4 text-xs font-mono">
                                <span className={`${wordCount > MAX_WORD_COUNT ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                                    {wordCount} / {MAX_WORD_COUNT} WORDS
                                </span>
                                {input && (
                                    <button onClick={clearInput} className="text-gray-400 hover:text-red-500 transition-colors" title="Clear All">
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Text Area & Dropzone Wrapper */}
                        <div {...getRootProps()} className="flex-grow relative flex flex-col cursor-text group">
                            <input {...getInputProps()} />

                            {/* Drag Overlay (Visual Only) */}
                            {isDragActive && (
                                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-purple-50/90 dark:bg-purple-900/80 backdrop-blur-sm border-2 border-purple-500 border-dashed m-4 rounded-2xl animate-in fade-in duration-200">
                                    <Upload className="w-12 h-12 text-purple-600 animate-bounce mb-4" />
                                    <p className="text-xl font-bold text-purple-900 dark:text-purple-100">Drop file to upload</p>
                                </div>
                            )}

                            <textarea
                                className={`flex-grow w-full bg-transparent p-6 text-lg resize-none outline-none font-medium leading-relaxed custom-scrollbar
                                    ${loading ? 'opacity-50' : ''} placeholder:text-gray-300 dark:placeholder:text-gray-600
                                `}
                                placeholder="Paste your text here, type manually, or drag & drop a file..."
                                value={input}
                                onChange={handleInputChange}
                                spellCheck={false}
                                disabled={loading}
                            />
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="px-6 py-2 bg-red-50 dark:bg-red-900/20 border-t border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" /> {error}
                            </div>
                        )}

                        {/* Action Button */}
                        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700">
                            <button
                                onClick={handleAnalyze}
                                disabled={loading || !input.trim() || wordCount > MAX_WORD_COUNT}
                                className={`w-full py-4 rounded-xl font-bold text-lg text-white shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-3
                                    ${loading || !input.trim() || wordCount > MAX_WORD_COUNT
                                        ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:shadow-purple-500/30'
                                    }`}
                            >
                                {loading ? <RefreshCw className="animate-spin w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
                                {loading ? 'Humanizing Content...' : 'Humanize Text'}
                            </button>
                        </div>
                    </div>

                    {/* Right: Output Section */}
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col h-full overflow-hidden relative">
                        {!result ? (
                            <div className="flex-grow flex flex-col items-center justify-center text-gray-300 dark:text-gray-600 space-y-6 select-none opacity-60">
                                <div className="w-24 h-24 rounded-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                                    <Monitor className="w-10 h-10" />
                                </div>
                                <p className="text-xl font-medium">Results will appear here</p>
                            </div>
                        ) : (
                            <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500">

                                {/* Results Header */}
                                <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-900/30 flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold uppercase text-gray-400">Detection Score</span>
                                            <div className="flex items-baseline gap-2">
                                                <span className={`text-3xl font-black ${result.score < 10 ? 'text-green-500' : result.score < 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                                                    {result.score}%
                                                </span>
                                                <span className="text-xs font-semibold text-gray-500 uppercase">AI Probability</span>
                                            </div>
                                        </div>

                                        {result.score < 10 && (
                                            <div className="px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-bold flex items-center gap-1.5">
                                                <CheckCircle className="w-3.5 h-3.5" /> Human Passed
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        <button onClick={handleDownload} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-600 dark:text-gray-300" title="Download .txt">
                                            <Download className="w-5 h-5" />
                                        </button>
                                        <button onClick={handleCopy} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-blue-600 dark:text-blue-400" title="Copy to Clipboard">
                                            {copied ? <CheckCircle className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Content Scrollable */}
                                <div className="flex-grow overflow-y-auto custom-scrollbar p-6 space-y-6 bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900/50">

                                    {/* Humanized Text Block */}
                                    <div className="prose dark:prose-invert max-w-none">
                                        <div className="whitespace-pre-wrap leading-relaxed text-gray-800 dark:text-gray-200 text-lg">
                                            {result.humanized_text}
                                        </div>
                                    </div>

                                    {/* Analysis Footer */}
                                    <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                                        <h4 className="text-xs font-bold uppercase text-gray-400 mb-3 flex items-center gap-2">
                                            <Sparkles className="w-3 h-3" /> AI Analysis Report
                                        </h4>
                                        <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-4 text-sm text-blue-800 dark:text-blue-200 leading-relaxed border border-blue-100 dark:border-blue-900/30">
                                            {result.explanation}
                                        </div>

                                        {result.flagged_sentences && result.flagged_sentences.length > 0 && (
                                            <div className="mt-4">
                                                <h4 className="text-xs font-bold uppercase text-gray-400 mb-2">Flagged Patterns Rewritten</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {result.flagged_sentences.slice(0, 3).map((s, i) => (
                                                        <span key={i} className="text-xs px-2 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded border border-red-100 dark:border-red-900/30 truncate max-w-[200px]">
                                                            "{s}"
                                                        </span>
                                                    ))}
                                                    {result.flagged_sentences.length > 3 && (
                                                        <span className="text-xs px-2 py-1 text-gray-400">+ {result.flagged_sentences.length - 3} more</span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                </div>
                            </div>
                        )}

                        {/* Loading State Overlay */}
                        {loading && (
                            <div className="absolute inset-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md z-20 flex flex-col items-center justify-center">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-purple-500 blur-xl opacity-20 animate-pulse rounded-full"></div>
                                    <RefreshCw className="relative w-16 h-16 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 animate-spin" />
                                </div>
                                <h3 className="mt-6 text-2xl font-bold text-gray-800 dark:text-gray-100 animate-pulse">Humanizing...</h3>
                                <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">Targeting 0% AI Detection Score</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
