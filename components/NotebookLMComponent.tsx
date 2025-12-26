import React, { FC, useEffect, useState } from 'react';
import { Loader2, Zap, Lightbulb } from 'lucide-react';

interface NotebookLMProps {
    title: string;
    content: string;
}

interface InsightQA {
    question: string;
    answer: string;
}

interface InsightResponse {
    summary: string;
    qa: InsightQA[];
}

const NotebookLMComponent: FC<NotebookLMProps> = ({ title, content }) => {
    const [insights, setInsights] = useState<InsightResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Fetch only if content is long enough and insights are not yet loaded
        if (content?.length > 200 && !insights && !loading) {
            fetchInsights();
        }
    }, [content]);

    const fetchInsights = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('http://localhost:3000/api/generate-insights', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, content }),
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || `HTTP Error: ${response.status}`);
            }

            const data: InsightResponse = await response.json();
            setInsights(data);

        } catch (err) {
            console.error('Failed to fetch insights:', err);
            setError(err instanceof Error ? err.message : 'Unknown error fetching insights.');
        } finally {
            setLoading(false);
        }
    };

    // --- UI Rendering ---
    if (loading) {
        return (
            <div className="flex items-center justify-center p-6 my-8 border border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-950 rounded-lg text-primary-600 dark:text-primary-400">
                <Loader2 className="animate-spin w-5 h-5 mr-3" />
                <span>Generating AI Insights...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 my-8 bg-red-100 dark:bg-red-950 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg">
                <p>⚠️ Error loading insights: {error}</p>
            </div>
        );
    }

    if (insights) {
        return (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl my-10 border-t-4 border-primary-500">
                <h2 className="text-2xl font-bold flex items-center mb-6 text-gray-900 dark:text-white">
                    <Lightbulb className="w-6 h-6 mr-3 text-primary-500" />
                    AI-Powered Insights
                </h2>

                {/* Summary Section */}
                <div className="mb-8">
                    <h3 className="text-xl font-semibold mb-3 text-primary-600 dark:text-primary-400 border-b pb-1">
                        Concise Summary
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {insights.summary}
                    </p>
                </div>

                {/* Q&A Section */}
                {insights.qa.length > 0 && (
                    <div>
                        <h3 className="text-xl font-semibold mb-3 text-primary-600 dark:text-primary-400 border-b pb-1">
                            Key Q&A
                        </h3>
                        <div className="space-y-4">
                            {insights.qa.map((item, idx) => (
                                <div key={idx} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                    <p className="font-medium text-gray-900 dark:text-white flex items-start">
                                        <Zap className="w-4 h-4 mr-2 mt-1 text-yellow-500 flex-shrink-0" />
                                        Q: {item.question}
                                    </p>
                                    <p className="ml-6 text-gray-700 dark:text-gray-300 mt-1">
                                        A: {item.answer}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Content too short or not fetched yet
    return null;
};

export default NotebookLMComponent;
