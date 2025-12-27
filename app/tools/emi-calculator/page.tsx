// 1. Notice we removed the { } and changed the name to match your file
import Emicalculator from '../../../pages/Emicalculator';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'EMI Calculator - Home, Car & Personal Loan | Bigyann',
    description: 'Calculate your monthly EMI for home loans, car loans, and personal loans easily with our accurate EMI calculator.',
};

// 2. Use the default import here
export default function Page() { 
    return <Emicalculator />; 
}