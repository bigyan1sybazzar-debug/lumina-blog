'use client';

import React from 'react';
import { LogIn, Send, CheckCircle, Zap, Code, Lightbulb } from 'lucide-react';
import Link from 'next/link';
import GoogleAdSense from '../components/GoogleAdSense';


export const SubmissionGuidePage: React.FC = () => {
    // --- Helper Component for a Clean Step Card ---
    const StepCard: React.FC<{ icon: React.ReactNode, title: string, description: string, linkTo: string, linkText: string, color: string }> =
        ({ icon, title, description, linkTo, linkText, color }) => (
            <div className={`p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border-t-4 border-${color}-500 transition-shadow hover:shadow-xl`}>
                <div className={`w-12 h-12 flex items-center justify-center rounded-full bg-${color}-100 dark:bg-${color}-900/50 text-${color}-600 dark:text-${color}-400 mb-4`}>
                    {icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">{description}</p>
                <Link
                    href={linkTo}
                    className={`inline-flex items-center gap-2 font-semibold text-${color}-600 dark:text-${color}-400 hover:text-${color}-700 transition-colors`}
                >
                    {linkText}
                    <Send className="w-4 h-4" />
                </Link>
            </div>
        );

    // --- Helper Component for a Clean Feature/Topic Card ---
    const FeatureCard: React.FC<{ icon: React.ReactNode, title: string, description: string, color: string }> =
        ({ icon, title, description, color }) => (
            <div className="p-5 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-sm">
                <div className={`flex items-center text-${color}-500 mb-2`}>
                    {icon}
                    <h3 className="ml-2 font-semibold text-gray-900 dark:text-white">{title}</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
            </div>
        );


    return (
        <>


            <div className="bg-white dark:bg-gray-900 min-h-screen py-16 md:py-24">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* Header */}
                    <header className="text-center mb-16">
                        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-3">
                            Start Writing for Bigyann 🚀
                        </h1>
                        <p className="text-lg text-primary-600 dark:text-primary-400 font-medium">
                            A simple, 3-step guide to becoming a published author.
                        </p>
                    </header>

                    {/* === SECTION 1: QUALITY AND AI POLICY === */}
                    <section className="mb-16">
                        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-8 text-center">
                            Our Content Standards
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                            {/* Card 1: Originality */}
                            <FeatureCard
                                icon={<CheckCircle className="w-5 h-5" />}
                                title="Be Original"
                                description="Only submit content that is unique and has not been published on any other platform."
                                color="green"
                            />

                            {/* Card 2: AI Policy */}
                            <FeatureCard
                                icon={<Zap className="w-5 h-5" />}
                                title="AI is Welcome"
                                description="Use tools like Gemini to draft, but you must manually fact-check and add unique Nepali context."
                                color="blue"
                            />

                            {/* Card 3: Formatting */}
                            <FeatureCard
                                icon={<Code className="w-5 h-5" />}
                                title="Keep it Clean"
                                description="Use H2/H3 headings, short paragraphs, and clear bullet points. Min 800 words recommended."
                                color="purple"
                            />
                        </div>
                    </section>


                    {/* === SECTION 2: TOPICS === */}
                    <section className="mb-16">
                        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-8 text-center">
                            Topics We Love to Publish
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <FeatureCard
                                icon={<Lightbulb className="w-5 h-5" />}
                                title="Tech Reviews"
                                description="Smartphones, gadgets, software reviews, and how-to guides."
                                color="yellow"
                            />
                            <FeatureCard
                                icon={<Zap className="w-5 h-5" />}
                                title="Price Analysis"
                                description="Accurate and current pricing trends for electronics in the Nepali market."
                                color="red"
                            />
                            <FeatureCard
                                icon={<Code className="w-5 h-5" />}
                                title="AI & Future Tech"
                                description="Insights into new AI models (Gemini, ChatGPT) and ethical tech discussions."
                                color="indigo"
                            />
                        </div>
                    </section>


                    {/* === SECTION 3: QUICK SUBMISSION STEPS (User-Friendly CTA) === */}
                    <section>
                        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-8 text-center">
                            Your 2-Step Submission Process
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                            {/* Step 1 */}
                            <StepCard
                                icon={<LogIn className="w-6 h-6" />}
                                title="Step 1: Create Account"
                                description="You need an active Bigyann account to access the author dashboard and track your articles."
                                linkTo="/login"
                                linkText="Login / Sign Up Now"
                                color="green"
                            />

                            {/* Step 2 */}
                            <StepCard
                                icon={<Send className="w-6 h-6" />}
                                title="Step 2: Submit Your Draft"
                                description="Once logged in, you can write and submit anything you like, it will be published once admin approved."
                                linkTo="https://bigyann.com.np/"
                                linkText="Go to Home"
                                color="indigo"
                            />

                        </div>
                    </section>

                </div>
            </div>

            {/* AdSense: Page Bottom */}
            <div className="max-w-4xl mx-auto px-4 py-12 flex justify-center text-center">
                <GoogleAdSense
                    slot="7838572857"
                    format="auto"
                    responsive={true}
                />
            </div>
        </>
    );
};

export default SubmissionGuidePage;