'use client';

import React from 'react';
import PromptLibrary from '../components/PromptLibrary';
import { Sparkles } from 'lucide-react';
import GoogleAdSense from '../components/GoogleAdSense';

const PromptsPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-primary-600 to-purple-600 dark:from-primary-700 dark:to-purple-700 py-16">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center text-white">
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <Sparkles size={40} />
                            <h1 className="text-4xl md:text-5xl font-bold">Prompts Library</h1>
                        </div>
                        <p className="text-xl text-white/90 max-w-2xl mx-auto">
                            Discover and copy high-quality prompts for AI, writing, marketing, development, and more
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 py-12">
                <PromptLibrary />
            </div>

            {/* AdSense: Page Bottom */}
            <div className="max-w-7xl mx-auto px-4 py-12 flex justify-center">
                <GoogleAdSense
                    slot="7838572857"
                    format="auto"
                    responsive={true}
                />
            </div>
        </div>
    );
};

export default PromptsPage;
