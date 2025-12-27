// Removed { } because TempMailTool is now a default export
import TempMailTool from '../../../pages/TempMailTool';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Temp Mail - Disposable Temporary Email | Bigyann',
    description: 'Get a free temporary email address instantly. Protect your privacy and avoid spam with our disposable mail service.',
};

export default function Page() { 
    return <TempMailTool />; 
}