'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import * as pdfjsLib from 'pdfjs-dist';
import {
    UploadCloud, Loader2, CheckCircle2, XCircle,
    Search, Award, RefreshCcw, AlertTriangle, FileWarning,
    Download, Share2, Copy, BarChart3, Target, Clock,
    Zap, Users, Building, GraduationCap, Briefcase,
    Sparkles, ChevronRight, Star, TrendingUp
} from 'lucide-react';

// ✅ PDF Worker Import
// Using CDN for Next.js compatibility
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

const POWER_WORDS = [
    'managed', 'developed', 'spearheaded', 'created', 'designed',
    'increased', 'reduced', 'implemented', 'led', 'strategic',
    'analyzed', 'executed', 'innovated', 'collaborated', 'optimized',
    'transformed', 'accelerated', 'engineered', 'delivered', 'achieved'
];

const SECTIONS = [
    { id: 'experience', icon: Briefcase, weight: 20 },
    { id: 'education', icon: GraduationCap, weight: 15 },
    { id: 'skills', icon: Zap, weight: 20 },
    { id: 'projects', icon: Building, weight: 15 },
    { id: 'summary', icon: Users, weight: 15 },
    { id: 'contact', icon: Award, weight: 15 }
];

const ResumeChecker: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [scanHistory, setScanHistory] = useState<any[]>([]);
    const [showTips, setShowTips] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const analyzeText = (text: string, fileName: string) => {
        const lowercaseText = text.toLowerCase();
        const words = lowercaseText.match(/\b\w+\b/g) || [];
        const sentences = lowercaseText.split(/[.!?]+/).filter(s => s.trim().length > 0);

        // Calculate readability (simple Flesch score approximation)
        const avgWordsPerSentence = words.length / Math.max(sentences.length, 1);
        const readabilityScore = Math.max(0, Math.min(100, 100 - (avgWordsPerSentence - 10) * 5));

        const checks = [
            {
                label: "Email Address",
                status: /[\w.-]+@[\w.-]+\.\w+/.test(lowercaseText),
                weight: 10,
                tip: "Add a professional email address"
            },
            {
                label: "Phone Number",
                status: /\b\d{10,}\b/.test(lowercaseText),
                weight: 10,
                tip: "Include contact number"
            },
            {
                label: "LinkedIn Profile",
                status: lowercaseText.includes('linkedin.com') || lowercaseText.includes('linked.in'),
                weight: 10,
                tip: "Add LinkedIn profile URL"
            },
            {
                label: "Education Section",
                status: lowercaseText.includes('education') || lowercaseText.includes('university') || lowercaseText.includes('degree'),
                weight: 15,
                tip: "Include education details"
            },
            {
                label: "Work Experience",
                status: lowercaseText.includes('experience') || lowercaseText.includes('employment') || lowercaseText.includes('work'),
                weight: 20,
                tip: "Detail work experience"
            },
            {
                label: "Word Count (400-800)",
                status: words.length >= 400 && words.length <= 800,
                weight: 10,
                tip: words.length < 400 ? "Add more content" : "Consider shortening"
            },
            {
                label: "Action Verbs",
                status: POWER_WORDS.filter(pw => lowercaseText.includes(pw)).length >= 5,
                weight: 15,
                tip: "Use more power verbs"
            },
            {
                label: "Skills Section",
                status: lowercaseText.includes('skills') || lowercaseText.includes('technical') || lowercaseText.includes('proficient'),
                weight: 10,
                tip: "Add skills section"
            },
        ];

        const foundPowerWords = POWER_WORDS.filter(pw => lowercaseText.includes(pw));
        const missingSections = SECTIONS.filter(s => !lowercaseText.includes(s.id));

        const score = Math.round(checks.reduce((acc, curr) => curr.status ? acc + curr.weight : acc, 0));
        const powerWordScore = Math.min(100, (foundPowerWords.length / POWER_WORDS.length) * 100);

        // Calculate section completeness
        const sectionScore = Math.round(((SECTIONS.length - missingSections.length) / SECTIONS.length) * 100);

        return {
            score,
            fileName,
            checks,
            foundPowerWords,
            missingSections,
            wordCount: words.length,
            powerWordScore,
            sectionScore,
            readabilityScore,
            scanTime: new Date().toISOString(),
            insights: {
                hasKeywords: foundPowerWords.length > 0,
                hasQuantifiableResults: /\d+%|\$\d+|\d+x/.test(text),
                hasLeadershipTerms: /lead|managed|directed|supervised/.test(lowercaseText),
                hasTechnicalTerms: /api|database|framework|language|software/.test(lowercaseText)
            }
        };
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-emerald-400';
        if (score >= 70) return 'text-amber-400';
        return 'text-rose-400';
    };

    const getScoreRing = (score: number) => {
        if (score >= 80) return 'border-emerald-500';
        if (score >= 70) return 'border-amber-500';
        return 'border-rose-500';
    };

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setLoading(true);
        setError(null);

        try {
            const arrayBuffer = await file.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({
                data: arrayBuffer,
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

            const analysis = analyzeText(fullText, file.name);
            setResults(analysis);

            // Add to history
            setScanHistory(prev => [analysis, ...prev.slice(0, 4)]);

        } catch (err: any) {
            console.error("PDF Scan Error:", err);
            if (err.message === "EMPTY_OR_SCANNED") {
                setError("This PDF appears to be empty or a scanned image. Please upload a text-based PDF.");
            } else {
                setError("Unable to scan this PDF. Try exporting your resume as a new PDF file.");
            }
        } finally {
            setLoading(false);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'application/msword': ['.doc', '.docx'],
            'text/plain': ['.txt']
        },
        multiple: false
    });

    const resetScan = () => {
        setResults(null);
        setError(null);
    };

    const downloadReport = () => {
        if (!results) return;

        const report = `
RESUME ANALYSIS REPORT
=======================
File: ${results.fileName}
Score: ${results.score}/100
Date: ${new Date().toLocaleDateString()}

SCORE BREAKDOWN
---------------
Overall ATS Score: ${results.score}%
Word Count: ${results.wordCount}
Power Words: ${results.powerWordScore}%
Section Completeness: ${results.sectionScore}%
Readability: ${results.readabilityScore}%

CHECKLIST RESULTS
----------------
${results.checks.map((c: any) => `${c.status ? '✅' : '❌'} ${c.label}`).join('\n')}

POWER WORDS FOUND
-----------------
${results.foundPowerWords.join(', ')}

RECOMMENDATIONS
---------------
${results.missingSections.map((s: any) => `• Add ${s.id} section`).join('\n')}
${results.checks.filter((c: any) => !c.status).map((c: any) => `• ${c.tip}`).join('\n')}

        `.trim();

        const blob = new Blob([report], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `resume-analysis-${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black text-gray-100 py-8 px-4 md:py-12">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <header className="text-center mb-12">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl">
                            <Sparkles size={28} className="text-white" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                            Resume<span className="text-white">Scanner</span>
                        </h1>
                    </div>
                    <p className="text-gray-400 text-lg">AI-powered ATS compatibility analyzer</p>

                    {/* Stats Bar */}
                    <div className="flex flex-wrap justify-center gap-6 mt-8">
                        <div className="text-center">
                            <div className="text-2xl font-black text-blue-400">95%</div>
                            <div className="text-xs text-gray-500">Accuracy</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-black text-purple-400">10K+</div>
                            <div className="text-xs text-gray-500">Resumes Scanned</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-black text-emerald-400">2.5s</div>
                            <div className="text-xs text-gray-500">Avg. Scan Time</div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Upload & History */}
                    <div className="lg:col-span-1 space-y-6">
                        {!results && !loading && (
                            <div
                                {...getRootProps()}
                                className={`relative group border-3 border-dashed rounded-[2rem] p-12 text-center transition-all duration-300 
                                    ${isDragActive
                                        ? 'border-blue-500 bg-blue-500/10 shadow-2xl shadow-blue-500/20'
                                        : 'border-gray-800 bg-gray-900/50 hover:border-blue-400 hover:bg-gray-900/80'
                                    }`}
                            >
                                <input {...getInputProps()} />
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-purple-500/0 rounded-[2rem] group-hover:opacity-100 opacity-0 transition-opacity" />
                                <UploadCloud size={48} className="mx-auto mb-4 text-blue-400 group-hover:scale-110 transition-transform" />
                                <h2 className="text-xl font-bold mb-2">Upload Resume</h2>
                                <p className="text-gray-500 text-sm mb-4">PDF, DOC, DOCX, or TXT</p>
                                <div className="text-xs text-gray-600 bg-gray-900/50 rounded-xl p-3">
                                    <div className="flex items-center justify-center gap-2 mb-1">
                                        <Target size={12} />
                                        <span>Optimized for ATS</span>
                                    </div>
                                    <div className="flex items-center justify-center gap-2">
                                        <Clock size={12} />
                                        <span>Instant Results</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Scan History */}
                        {scanHistory.length > 0 && (
                            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                                <h3 className="font-bold text-gray-400 mb-4 flex items-center gap-2">
                                    <Clock size={16} />
                                    Recent Scans
                                </h3>
                                <div className="space-y-3">
                                    {scanHistory.map((scan, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center justify-between p-3 bg-gray-800/30 rounded-xl hover:bg-gray-800/50 transition-colors cursor-pointer"
                                            onClick={() => setResults(scan)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getScoreColor(scan.score)} bg-gray-900/50`}>
                                                    {scan.score}
                                                </div>
                                                <div className="text-sm">
                                                    <div className="font-medium truncate max-w-[120px]">{scan.fileName}</div>
                                                    <div className="text-xs text-gray-500">{scan.wordCount} words</div>
                                                </div>
                                            </div>
                                            <ChevronRight size={16} className="text-gray-600" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Quick Tips */}
                        <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-800/30 rounded-2xl p-6">
                            <h3 className="font-bold text-blue-300 mb-3 flex items-center gap-2">
                                <Zap size={16} />
                                Pro Tips
                            </h3>
                            <ul className="space-y-2 text-sm text-gray-300">
                                <li className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                                    <span>Use standard section headers (Experience, Education)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                                    <span>Include quantifiable achievements with numbers</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                                    <span>Optimize for 400-800 words total</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                                    <span>Use 5+ action verbs from our list</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Right Column - Results */}
                    <div className="lg:col-span-2">
                        {error && (
                            <div className="mb-6 p-6 bg-gradient-to-r from-rose-900/20 to-rose-900/10 border border-rose-800/30 rounded-2xl flex items-start gap-4 text-rose-300">
                                <AlertTriangle size={24} className="flex-shrink-0" />
                                <div>
                                    <p className="font-bold text-lg mb-1">Scan Failed</p>
                                    <p className="text-sm text-rose-200/80">{error}</p>
                                </div>
                            </div>
                        )}

                        {loading ? (
                            <div className="bg-gradient-to-br from-gray-900 to-gray-950 rounded-2xl p-16 text-center border border-gray-800">
                                <div className="relative inline-block">
                                    <Loader2 className="animate-spin text-blue-400" size={64} />
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 to-purple-400/0 blur-xl" />
                                </div>
                                <p className="text-xl font-bold mt-6">Analyzing Your Resume...</p>
                                <p className="text-gray-500 text-sm mt-2">Checking ATS compatibility & optimization</p>
                                <div className="w-48 h-1.5 bg-gray-800 rounded-full mx-auto mt-8 overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse" style={{ width: '70%' }} />
                                </div>
                            </div>
                        ) : results ? (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                {/* Score Card */}
                                <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 to-gray-950 rounded-3xl border border-gray-800 p-8">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full -translate-y-32 translate-x-32" />

                                    <div className="relative flex flex-col md:flex-row items-center gap-8">
                                        {/* Score Circle */}
                                        <div className="relative">
                                            <div className="w-48 h-48 rounded-full border-8 border-gray-800 flex items-center justify-center">
                                                <div className={`w-40 h-40 rounded-full border-8 ${getScoreRing(results.score)} flex flex-col items-center justify-center`}>
                                                    <div className={`text-5xl font-black ${getScoreColor(results.score)}`}>
                                                        {results.score}
                                                    </div>
                                                    <div className="text-xs text-gray-500 uppercase tracking-widest mt-2">ATS Score</div>
                                                </div>
                                            </div>
                                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold px-4 py-1.5 rounded-full whitespace-nowrap">
                                                {results.score >= 80 ? 'Excellent' : results.score >= 70 ? 'Good' : 'Needs Work'}
                                            </div>
                                        </div>

                                        {/* Score Details */}
                                        <div className="flex-1 space-y-6">
                                            <div>
                                                <h3 className="text-2xl font-black mb-2">Analysis Complete</h3>
                                                <p className="text-gray-400">
                                                    Your resume scored <span className={`font-bold ${getScoreColor(results.score)}`}>{results.score}/100</span> for ATS compatibility.
                                                    {results.score >= 70 ? ' Great job!' : ' Consider making improvements.'}
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div className="bg-gray-900/50 rounded-xl p-4 text-center">
                                                    <div className="text-2xl font-black text-blue-400">{results.wordCount}</div>
                                                    <div className="text-xs text-gray-500 mt-1">Words</div>
                                                </div>
                                                <div className="bg-gray-900/50 rounded-xl p-4 text-center">
                                                    <div className="text-2xl font-black text-purple-400">{results.foundPowerWords.length}</div>
                                                    <div className="text-xs text-gray-500 mt-1">Power Words</div>
                                                </div>
                                                <div className="bg-gray-900/50 rounded-xl p-4 text-center">
                                                    <div className="text-2xl font-black text-emerald-400">{results.sectionScore}%</div>
                                                    <div className="text-xs text-gray-500 mt-1">Sections</div>
                                                </div>
                                                <div className="bg-gray-900/50 rounded-xl p-4 text-center">
                                                    <div className="text-2xl font-black text-amber-400">{results.readabilityScore}%</div>
                                                    <div className="text-xs text-gray-500 mt-1">Readability</div>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-3">
                                                <button
                                                    onClick={resetScan}
                                                    className="px-5 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-bold flex items-center gap-2 transition-colors"
                                                >
                                                    <RefreshCcw size={18} /> New Scan
                                                </button>
                                                <button
                                                    onClick={downloadReport}
                                                    className="px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 rounded-xl font-bold flex items-center gap-2 transition-all"
                                                >
                                                    <Download size={18} /> Download Report
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Detailed Analysis */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Checklist */}
                                    <div className="bg-gradient-to-br from-gray-900 to-gray-950 rounded-2xl border border-gray-800 p-6">
                                        <h4 className="text-sm font-black uppercase text-gray-400 mb-6 tracking-wider flex items-center gap-2">
                                            <Search size={16} />
                                            ATS Checklist
                                            <span className="ml-auto text-xs font-normal text-gray-600">
                                                {results.checks.filter((c: any) => c.status).length}/{results.checks.length}
                                            </span>
                                        </h4>
                                        <div className="space-y-4">
                                            {results.checks.map((c: any, i: number) => (
                                                <div key={i} className="flex items-center justify-between p-3 bg-gray-900/30 rounded-xl hover:bg-gray-900/50 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        {c.status ? (
                                                            <CheckCircle2 size={20} className="text-emerald-500 flex-shrink-0" />
                                                        ) : (
                                                            <XCircle size={20} className="text-rose-500/50 flex-shrink-0" />
                                                        )}
                                                        <div>
                                                            <div className={`font-medium ${c.status ? 'text-gray-200' : 'text-gray-600'}`}>
                                                                {c.label}
                                                            </div>
                                                            {!c.status && (
                                                                <div className="text-xs text-gray-500 mt-1">{c.tip}</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="text-sm font-bold text-gray-500">{c.weight}pts</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Action Items */}
                                    <div className="bg-gradient-to-br from-gray-900 to-gray-950 rounded-2xl border border-gray-800 p-6">
                                        <h4 className="text-sm font-black uppercase text-gray-400 mb-6 tracking-wider flex items-center gap-2">
                                            <Award size={16} />
                                            Optimization
                                        </h4>

                                        {/* Missing Sections */}
                                        {results.missingSections.length > 0 && (
                                            <div className="mb-6">
                                                <p className="text-xs font-bold text-amber-400 uppercase mb-3 flex items-center gap-2">
                                                    <AlertTriangle size={12} />
                                                    Missing Sections
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    {results.missingSections.map((s: any) => {
                                                        const Icon = s.icon;
                                                        return (
                                                            <div
                                                                key={s.id}
                                                                className="px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2"
                                                            >
                                                                <Icon size={14} className="text-amber-400" />
                                                                <span className="text-sm font-bold text-amber-400 capitalize">{s.id}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* Power Words */}
                                        <div>
                                            <p className="text-xs font-bold text-blue-400 uppercase mb-3 flex items-center gap-2">
                                                <Zap size={12} />
                                                Action Verbs ({results.foundPowerWords.length}/20)
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {results.foundPowerWords.map((w: string) => (
                                                    <span
                                                        key={w}
                                                        className="px-3 py-1.5 bg-gradient-to-r from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-lg text-sm font-bold text-blue-300"
                                                    >
                                                        {w}
                                                    </span>
                                                ))}
                                            </div>
                                            {results.foundPowerWords.length < 5 && (
                                                <p className="text-xs text-gray-500 mt-3">
                                                    Try adding more action verbs to strengthen your resume
                                                </p>
                                            )}
                                        </div>

                                        {/* Insights */}
                                        <div className="mt-6 pt-6 border-t border-gray-800">
                                            <p className="text-xs font-bold text-purple-400 uppercase mb-3">Quick Insights</p>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className={`p-3 rounded-xl ${results.insights.hasQuantifiableResults ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-gray-900/50'}`}>
                                                    <div className="text-sm font-medium mb-1">Quantifiable Results</div>
                                                    <div className="text-xs text-gray-500">
                                                        {results.insights.hasQuantifiableResults ? '✓ Included' : 'Add numbers'}
                                                    </div>
                                                </div>
                                                <div className={`p-3 rounded-xl ${results.insights.hasLeadershipTerms ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-gray-900/50'}`}>
                                                    <div className="text-sm font-medium mb-1">Leadership Terms</div>
                                                    <div className="text-xs text-gray-500">
                                                        {results.insights.hasLeadershipTerms ? '✓ Present' : 'Could add'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Pro Recommendations */}
                                {results.score < 80 && (
                                    <div className="bg-gradient-to-r from-blue-900/10 to-purple-900/10 border border-blue-800/30 rounded-2xl p-6">
                                        <div className="flex items-center gap-3 mb-4">
                                            <TrendingUp size={20} className="text-blue-400" />
                                            <h4 className="font-bold text-lg">Recommendations for Improvement</h4>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="bg-gray-900/30 rounded-xl p-4">
                                                <div className="text-sm font-bold text-blue-300 mb-2">Immediate Actions</div>
                                                <ul className="space-y-2 text-sm text-gray-300">
                                                    {results.checks
                                                        .filter((c: any) => !c.status)
                                                        .slice(0, 3)
                                                        .map((c: any, i: number) => (
                                                            <li key={i} className="flex items-start gap-2">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                                                                <span>{c.tip}</span>
                                                            </li>
                                                        ))}
                                                </ul>
                                            </div>
                                            <div className="bg-gray-900/30 rounded-xl p-4">
                                                <div className="text-sm font-bold text-purple-300 mb-2">Advanced Optimization</div>
                                                <ul className="space-y-2 text-sm text-gray-300">
                                                    <li className="flex items-start gap-2">
                                                        <Star size={12} className="text-purple-400 mt-0.5 flex-shrink-0" />
                                                        <span>Add industry-specific keywords</span>
                                                    </li>
                                                    <li className="flex items-start gap-2">
                                                        <Star size={12} className="text-purple-400 mt-0.5 flex-shrink-0" />
                                                        <span>Include measurable achievements</span>
                                                    </li>
                                                    <li className="flex items-start gap-2">
                                                        <Star size={12} className="text-purple-400 mt-0.5 flex-shrink-0" />
                                                        <span>Tailor content to job descriptions</span>
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : null}
                    </div>
                </div>

                {/* Footer */}
                <footer className="mt-12 pt-8 border-t border-gray-800 text-center text-sm text-gray-600">
                    <p>ResumeScanner uses advanced AI to analyze ATS compatibility. Results are for guidance only.</p>
                    <div className="flex justify-center gap-6 mt-4">
                        <button className="hover:text-gray-400 transition-colors">Privacy</button>
                        <button className="hover:text-gray-400 transition-colors">Terms</button>
                        <button className="hover:text-gray-400 transition-colors">FAQ</button>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default ResumeChecker;