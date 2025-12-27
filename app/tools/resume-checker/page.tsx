// 1. Removed the { } curly braces for the default import
import ResumeChecker from '../../../pages/ResumeChecker';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'AI Resume Checker - ATS Score & Feedback | Bigyann',
    description: 'Analyze your resume with AI. Get ATS capability scores and actionable feedback to improve your CV.',
};

// 2. This will now work correctly with the default export
export default function Page() { 
    return <ResumeChecker />; 
}