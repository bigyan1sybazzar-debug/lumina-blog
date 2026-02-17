import AITranslator from '../../../pages/AITranslator';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'AI Translator - Multi-language Translation | Bigyann',
    description: 'Translate text between multiple languages using advanced AI. Accurate and natural translations.',
};

export default function Page() { return <AITranslator />; }
