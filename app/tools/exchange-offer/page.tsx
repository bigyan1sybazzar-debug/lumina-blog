import ExchangeOffer from '../../../pages/ExchangeOffer';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Exchange Offer - Check Old Phone Value | Bigyann',
    description: 'Find out the best exchange value for your old mobile phone. Get great deals on upgrades.',
};

export default function Page() { return <ExchangeOffer />; }
