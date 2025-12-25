import React, { useState, useEffect, useCallback } from 'react';
import { Languages, Loader2, Copy, CheckCircle, Send, ArrowRightLeft, Zap } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const languages = [
  { name: 'Auto Detect', code: 'auto' },
  { name: 'English', code: 'en' },
  { name: 'Nepali', code: 'ne' },
  { name: 'Hindi', code: 'hi' },
  { name: 'Spanish', code: 'es' },
  { name: 'French', code: 'fr' },
  { name: 'German', code: 'de' },
  { name: 'Chinese', code: 'zh' },
  { name: 'Japanese', code: 'ja' },
];

const AITranslator: React.FC = () => {
  const [text, setText] = useState('');
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('ne');
  const [translatedText, setTranslatedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // The actual translation logic
  const translateAction = useCallback(async (query: string) => {
    if (!query.trim()) {
      setTranslatedText('');
      return;
    }

    setLoading(true);
    try {
      const url = `/api-google-translate/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(query)}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data && data[0]) {
        let fullTranslation = "";
        data[0].forEach((segment: any) => {
          if (segment[0]) fullTranslation += segment[0];
        });
        setTranslatedText(fullTranslation);
      }
    } catch (error) {
      console.error("Translation Error:", error);
    } finally {
      setLoading(false);
      setIsTyping(false);
    }
  }, [sourceLang, targetLang]);

  // Live Typing Effect (Debounce)
  useEffect(() => {
    if (!text) {
      setTranslatedText('');
      return;
    }

    setIsTyping(true);
    const delayDebounceFn = setTimeout(() => {
      translateAction(text);
    }, 800); // Wait 800ms after user stops typing

    return () => clearTimeout(delayDebounceFn);
  }, [text, translateAction]);

  const swapLanguages = () => {
    if (sourceLang === 'auto') return;
    const temp = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(temp);
  };

  return (
    <div className="min-h-screen bg-[#0a0c10] text-gray-100 py-16 px-6 relative">
      <Helmet><title>Live Translator | Bigyann</title></Helmet>

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest mb-6">
            <Zap size={12} className="fill-current" /> Live Translation Active
          </div>
          <h1 className="text-5xl md:text-6xl font-black mb-6 tracking-tighter">
            Bigyann <span className="text-blue-500 font-serif italic">Translate.</span>
          </h1>
        </div>

        {/* Language Controls */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-8">
          <div className="bg-[#161b22] border border-gray-800 p-2 rounded-2xl flex items-center shadow-lg">
            <span className="px-4 text-[10px] font-black text-gray-600 uppercase">From</span>
            <select 
              value={sourceLang} 
              onChange={(e) => setSourceLang(e.target.value)}
              className="bg-transparent p-2 outline-none text-sm font-bold text-blue-400 cursor-pointer min-w-[120px]"
            >
              {languages.map(l => <option key={l.code} value={l.code} className="bg-[#161b22]">{l.name}</option>)}
            </select>
          </div>

          <button onClick={swapLanguages} className="p-4 bg-gray-800 rounded-full hover:bg-blue-600 transition-all active:scale-90 shadow-xl">
            <ArrowRightLeft size={18} />
          </button>

          <div className="bg-[#161b22] border border-gray-800 p-2 rounded-2xl flex items-center shadow-lg">
            <span className="px-4 text-[10px] font-black text-gray-600 uppercase">To</span>
            <select 
              value={targetLang} 
              onChange={(e) => setTargetLang(e.target.value)}
              className="bg-transparent p-2 outline-none text-sm font-bold text-blue-400 cursor-pointer min-w-[120px]"
            >
              {languages.filter(l => l.code !== 'auto').map(l => (
                <option key={l.code} value={l.code} className="bg-[#161b22]">{l.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Input Area */}
          <div className="bg-[#161b22] border border-gray-800 rounded-[2.5rem] p-8 shadow-2xl focus-within:border-blue-500/50 transition-colors">
            <div className="flex justify-between items-center mb-4">
               <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Input</span>
               {isTyping && <span className="text-[10px] font-bold text-blue-500 animate-pulse">Typing...</span>}
            </div>
            <textarea
              className="w-full h-64 bg-transparent text-xl md:text-2xl font-medium resize-none outline-none placeholder:text-gray-800 text-blue-50"
              placeholder="Start typing to translate live..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>

          {/* Output Area */}
          <div className="bg-[#161b22] border border-gray-800 rounded-[2.5rem] p-8 relative min-h-[300px] shadow-2xl">
            <div className="flex justify-between items-center mb-4">
               <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Result</span>
               {loading && <Loader2 className="animate-spin text-blue-500" size={16} />}
            </div>
            <div className="w-full h-64 text-xl md:text-2xl font-medium overflow-y-auto text-white leading-relaxed">
              {translatedText || <span className="text-gray-800 italic text-lg">Translation will appear here instantly...</span>}
            </div>
            
            {translatedText && (
              <button 
                onClick={() => { navigator.clipboard.writeText(translatedText); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                className="absolute bottom-6 right-6 p-4 bg-gray-800 hover:bg-gray-700 rounded-2xl text-gray-400 transition-all hover:text-white"
              >
                {copied ? <CheckCircle size={22} className="text-green-500" /> : <Copy size={22} />}
              </button>
            )}
          </div>
        </div>

        <p className="text-center mt-8 text-gray-600 text-xs font-medium">
            Translations are processed automatically after you stop typing.
        </p>
      </div>
    </div>
  );
};

export default AITranslator;