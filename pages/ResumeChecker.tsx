import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import * as pdfjsLib from 'pdfjs-dist';
import { 
  UploadCloud, Loader2, CheckCircle2, XCircle, 
  Search, Award, RefreshCcw, AlertTriangle, FileWarning 
} from 'lucide-react';

// ✅ THE ULTIMATE VITE FIX: Import worker directly from the package
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const POWER_WORDS = ['managed', 'developed', 'spearheaded', 'created', 'designed', 'increased', 'reduced', 'implemented', 'led', 'strategic', 'analyzed', 'executed', 'innovated', 'collaborated'];
const SECTIONS = ['experience', 'education', 'skills', 'projects', 'summary', 'contact'];

const ResumeChecker: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const analyzeText = (text: string) => {
        const lowercaseText = text.toLowerCase();
        const words = lowercaseText.match(/\b\w+\b/g) || [];
        
        const checks = [
            { label: "Email Address", status: /[\w.-]+@[\w.-]+\.\w+/.test(lowercaseText), weight: 15 },
            { label: "Phone Number", status: /\b\d{10,}\b/.test(lowercaseText), weight: 15 },
            { label: "LinkedIn Link", status: lowercaseText.includes('linkedin.com'), weight: 10 },
            { label: "Education History", status: lowercaseText.includes('education'), weight: 15 },
            { label: "Work Experience", status: lowercaseText.includes('experience') || lowercaseText.includes('work'), weight: 15 },
            { label: "Word Count (400+)", status: words.length >= 400, weight: 10 },
            { label: "Action Verbs", status: POWER_WORDS.filter(pw => lowercaseText.includes(pw)).length >= 3, weight: 20 },
        ];

        const score = checks.reduce((acc, curr) => curr.status ? acc + curr.weight : acc, 0);
        return {
            score,
            checks,
            foundPowerWords: POWER_WORDS.filter(pw => lowercaseText.includes(pw)),
            missingSections: SECTIONS.filter(s => !lowercaseText.includes(s)),
            wordCount: words.length
        };
    };

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setLoading(true);
        setError(null);
        setResults(null);

        try {
            const arrayBuffer = await file.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({
                data: arrayBuffer,
                // Disable font faces to prevent "font loading" errors
                disableFontFace: true,
                verbosity: 0
            });

            const pdf = await loadingTask.promise;
            let fullText = "";

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items
                    .map((item: any) => item.str)
                    .join(" ");
                fullText += pageText + " ";
            }

            if (fullText.trim().length < 50) {
                throw new Error("EMPTY_OR_SCANNED");
            }

            setResults(analyzeText(fullText));
        } catch (err: any) {
            console.error("PDF Scan Error:", err);
            if (err.message === "EMPTY_OR_SCANNED") {
                setError("This PDF is empty or a scanned image. Please use a text-based PDF.");
            } else {
                setError("Worker failed to scan this PDF. Try exporting your resume as a new PDF file.");
            }
        } finally {
            setLoading(false);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'] },
        multiple: false
    });

    return (
        <div className="min-h-screen bg-[#0a0c10] text-gray-100 py-16 px-4">
            <div className="max-w-4xl mx-auto">
                <header className="text-center mb-12">
                    <h1 className="text-5xl font-black mb-4">Resume <span className="text-blue-500">Scanner.</span></h1>
                    <p className="text-gray-400">Instant ATS compatibility check.</p>
                </header>

                {error && (
                    <div className="mb-8 p-6 bg-red-500/10 border border-red-500/20 rounded-[2rem] flex items-start gap-4 text-red-400">
                        <FileWarning size={24} />
                        <div>
                            <p className="font-bold">Scan Failed</p>
                            <p className="text-sm">{error}</p>
                        </div>
                    </div>
                )}

                {!results && !loading ? (
                    <div {...getRootProps()} className={`border-4 border-dashed rounded-[3rem] p-16 text-center transition-all bg-[#161b22] ${isDragActive ? 'border-blue-500 bg-blue-500/5' : 'border-gray-800'}`}>
                        <input {...getInputProps()} />
                        <UploadCloud size={64} className="mx-auto mb-4 text-blue-500" />
                        <h2 className="text-2xl font-bold mb-2">Upload Resume</h2>
                        <p className="text-gray-500 italic">Drag & Drop your PDF here</p>
                    </div>
                ) : loading ? (
                    <div className="bg-[#161b22] rounded-[3rem] p-24 text-center border border-gray-800">
                        <Loader2 className="animate-spin mx-auto mb-4 text-blue-500" size={56} />
                        <p className="text-xl font-bold">Reading PDF Layers...</p>
                    </div>
                ) : (
                    <div className="animate-in fade-in duration-700 space-y-8">
                        {/* Score Display */}
                        <div className="bg-[#161b22] p-10 rounded-[3rem] border border-gray-800 flex flex-col md:flex-row items-center gap-10">
                            <div className="w-36 h-36 rounded-full border-[10px] border-blue-500 flex items-center justify-center text-4xl font-black shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                                {results.score}%
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <h3 className="text-3xl font-black mb-2">Analysis Complete</h3>
                                <p className="text-gray-400 mb-6">Word count: {results.wordCount}. A score above 70% is recommended for most ATS.</p>
                                <button onClick={() => setResults(null)} className="px-6 py-3 bg-blue-600 rounded-2xl font-bold flex items-center gap-2 mx-auto md:mx-0">
                                   <RefreshCcw size={18} /> New Scan
                                </button>
                            </div>
                        </div>

                        {/* Detailed Results */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-[#161b22] p-8 rounded-[2.5rem] border border-gray-800">
                                <h4 className="text-xs font-black uppercase text-gray-500 mb-6 tracking-widest flex items-center gap-2"><Search size={14}/> Checklist</h4>
                                <div className="space-y-4">
                                    {results.checks.map((c: any, i: number) => (
                                        <div key={i} className="flex justify-between items-center text-sm">
                                            <span className={c.status ? 'text-gray-200' : 'text-gray-600'}>{c.label}</span>
                                            {c.status ? <CheckCircle2 size={18} className="text-green-500" /> : <XCircle size={18} className="text-red-500/30" />}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-[#161b22] p-8 rounded-[2.5rem] border border-gray-800">
                                <h4 className="text-xs font-black uppercase text-gray-500 mb-6 tracking-widest flex items-center gap-2"><Award size={14}/> Action Items</h4>
                                {results.missingSections.length > 0 && (
                                    <div className="mb-6">
                                        <p className="text-[10px] font-black text-amber-500 uppercase mb-2">Add these sections:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {results.missingSections.map((s: string) => (
                                                <span key={s} className="px-2 py-1 bg-amber-500/10 text-amber-500 text-[10px] font-bold rounded-lg uppercase">{s}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <p className="text-[10px] font-black text-blue-500 uppercase mb-2">Action verbs found:</p>
                                <div className="flex flex-wrap gap-2">
                                    {results.foundPowerWords.map((w: string) => (
                                        <span key={w} className="px-2 py-1 bg-blue-500/10 text-blue-400 text-[10px] font-bold rounded-lg uppercase">{w}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResumeChecker;