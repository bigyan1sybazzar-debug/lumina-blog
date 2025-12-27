import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Exchange Offer - Check Old Phone Value | Bigyann',
    description: 'Find out the best exchange value for your old mobile phone. Get great deals on upgrades.',
};

export default function Page() { 
    return (
        <div className="max-w-4xl mx-auto p-10 text-center">
            <h1 className="text-3xl font-bold mb-4">Exchange Offer Calculator</h1>
            <p className="text-gray-600">This tool is currently being migrated. Please check back in a few minutes!</p>
        </div>
    ); 
}