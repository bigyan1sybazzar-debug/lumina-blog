import Emicalculator from '../../../pages/Emicalculator';
import { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
    title: 'EMI Calculator - Home, Car & Personal Loan | Bigyann',
    description: 'Calculate your monthly EMI for home loans, car loans, and personal loans easily with our accurate EMI calculator.',
};

export default function Page() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <Emicalculator />
        </Suspense>
    );
}