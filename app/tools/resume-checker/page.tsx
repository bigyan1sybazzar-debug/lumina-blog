import { ResumeChecker } from '../../../pages/ResumeChecker';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'AI Resume Checker - ATS Score & Feedback | Bigyann',
    description: 'Analyze your resume with AI. Get ATS capability scores and actionable feedback to improve your CV.',
};

export default function Page() { return <ResumeChecker />; }
