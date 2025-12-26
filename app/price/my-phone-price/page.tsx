import { MyPhonePrice } from '../../../pages/My-phone-price';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'My Phone Price - Check Market Price | Bigyann',
    description: 'Check the current market price of your mobile phone. Get accurate valuation for selling or exchanging.',
};

export default function Page() { return <MyPhonePrice />; }
