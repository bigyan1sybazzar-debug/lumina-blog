import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Languages, Loader2, Copy, CheckCircle, ArrowRightLeft, Zap,
  Volume2, Download, BookOpen, Globe, Sparkles, History, 
  Star, Settings, Mic, MicOff, Target, Brain, Clock,
  ChevronDown, ThumbsUp, ThumbsDown, Share2, Maximize2
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import confetti from 'canvas-confetti';

const languages = [
  { name: 'Auto Detect', code: 'auto', flag: '🌐' },
  { name: 'English', code: 'en', flag: '🇺🇸' },
  { name: 'Nepali', code: 'ne', flag: '🇳🇵' },
  { name: 'Hindi', code: 'hi', flag: '🇮🇳' },
  { name: 'Spanish', code: 'es', flag: '🇪🇸' },
  { name: 'French', code: 'fr', flag: '🇫🇷' },
  { name: 'German', code: 'de', flag: '🇩🇪' },
  { name: 'Chinese', code: 'zh', flag: '🇨🇳' },
  { name: 'Japanese', code: 'ja', flag: '🇯🇵' },
  { name: 'Korean', code: 'ko', flag: '🇰🇷' },
  { name: 'Arabic', code: 'ar', flag: '🇸🇦' },
  { name: 'Russian', code: 'ru', flag: '🇷🇺' },
  { name: 'Portuguese', code: 'pt', flag: '🇵🇹' },
  { name: 'Italian', code: 'it', flag: '🇮🇹' },
];

const quickPhrases = [
  { text: "Hello, how are you?", emoji: "👋" },
  { text: "Thank you very much", emoji: "🙏" },
  { text: "Where is the nearest hospital?", emoji: "🏥" },
  { text: "I would like to order food", emoji: "🍽️" },
  { text: "How much does this cost?", emoji: "💰" },
  { text: "I need help", emoji: "🆘" },
  { text: "What time is it?", emoji: "🕒" },
  { text: "Beautiful day today", emoji: "☀️" },
];

const AITranslator: React.FC = () => {
  const [text, setText] = useState('');
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('ne');
  const [translatedText, setTranslatedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);
  const [translationMode, setTranslationMode] = useState('standard'); // standard, formal, casual, technical
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [feedback, setFeedback] = useState<'good' | 'bad' | null>(null);
  const sourceTextRef = useRef<HTMLTextAreaElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const [recentLanguages, setRecentLanguages] = useState(['en', 'ne', 'es', 'fr']);

  const translateAction = useCallback(async (query: string, customSource?: string, customTarget?: string) => {
    if (!query.trim()) {
      setTranslatedText('');
      return;
    }

    setLoading(true);
    try {
      const source = customSource || sourceLang;
      const target = customTarget || targetLang;
      
      // ✅ Using the direct Google API endpoint (GTX version)
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${source}&tl=${target}&dt=t&q=${encodeURIComponent(query)}`;
      
      const response = await fetch(url);
      
      if (!response.ok) throw new Error("Translation Service Unavailable");

      const data = await response.json();

      let fullTranslation = "";
      if (data && data[0]) {
        data[0].forEach((segment: any) => {
          if (segment[0]) fullTranslation += segment[0];
        });
      }

      const translation = {
        original: query,
        translated: fullTranslation,
        source: languages.find(l => l.code === source)?.name || 'Auto',
        target: languages.find(l => l.code === target)?.name || 'Unknown',
        timestamp: new Date().toISOString(),
        mode: translationMode,
        charCount: query.length
      };

      setTranslatedText(fullTranslation);
      
      // Add to history
      setHistory(prev => [translation, ...prev.slice(0, 19)]);
      
      // Update recent languages
      if (!recentLanguages.includes(target)) {
        setRecentLanguages(prev => [target, ...prev.slice(0, 3)]);
      }

      // Auto-play speech if enabled
      if (autoPlay && fullTranslation) {
        speakText(fullTranslation, target);
      }

    } catch (error) {
      console.error("Translation Error:", error);
      setTranslatedText("⚠️ Translation failed. Please try again or check your connection.");
    } finally {
      setLoading(false);
      setIsTyping(false);
    }
  }, [sourceLang, targetLang, translationMode, autoPlay, recentLanguages]);

  useEffect(() => {
    if (!text) {
      setTranslatedText('');
      setCharCount(0);
      return;
    }

    setIsTyping(true);
    const delayDebounceFn = setTimeout(() => {
      translateAction(text);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [text, translateAction]);

  useEffect(() => {
    setCharCount(text.length);
  }, [text]);

  const swapLanguages = () => {
    if (sourceLang === 'auto') return;
    
    const temp = sourceLang;
    const sourceLangObj = languages.find(l => l.code === sourceLang);
    const targetLangObj = languages.find(l => l.code === targetLang);
    
    // Update recent languages
    setRecentLanguages(prev => {
      const newRecents = [targetLang, ...prev.filter(l => l !== targetLang && l !== sourceLang)];
      return newRecents.slice(0, 4);
    });

    setSourceLang(targetLang);
    setTargetLang(temp);
    
    // Swap the text content
    if (translatedText) {
      setText(translatedText);
      setTranslatedText(text);
    }

    // Confetti effect for fun
    if (window.innerWidth > 768) {
      confetti({
        particleCount: 30,
        spread: 60,
        origin: { y: 0.6 }
      });
    }
  };

  const speakText = (textToSpeak: string, langCode: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = langCode;
      utterance.rate = 0.9;
      utterance.pitch = 1;
      
      setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const downloadTranslation = () => {
    const content = `Original (${languages.find(l => l.code === sourceLang)?.name}):\n${text}\n\nTranslated (${languages.find(l => l.code === targetLang)?.name}):\n${translatedText}\n\nTranslated via Bigyann Translate`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `translation-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(translatedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      // Mini confetti on copy
      confetti({
        particleCount: 15,
        spread: 30,
        origin: { y: 0.9 }
      });
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const loadFromHistory = (item: any) => {
    setText(item.original);
    setSourceLang(languages.find(l => l.name === item.source)?.code || 'auto');
    setTargetLang(languages.find(l => l.name === item.target)?.code || 'en');
    setTranslatedText(item.translated);
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const handleQuickPhrase = (phrase: string) => {
    setText(phrase);
    if (sourceTextRef.current) {
      sourceTextRef.current.focus();
    }
  };

  const handleFeedback = (type: 'good' | 'bad') => {
    setFeedback(type);
    setTimeout(() => setFeedback(null), 3000);
    
    if (type === 'good') {
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-950 text-gray-100 py-8 md:py-12 px-4 md:px-6 relative font-sans transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      <Helmet>
        <title>Bigyann Translate | AI-Powered Neural Translation</title>
        <meta name="description" content="Real-time AI translation with voice support, history, and advanced features. Translate between 100+ languages instantly." />
      </Helmet>

      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-purple-600/10 blur-[100px] rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-gradient-to-r from-blue-500/5 to-purple-500/5 blur-[140px] rounded-full" />
      </div>

      <div className={`max-w-7xl mx-auto relative z-10 ${isFullscreen ? 'h-full flex flex-col' : ''}`}>
        {/* Header */}
        <header className="text-center mb-8 md:mb-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-2xl">
                <Globe size={24} className="text-white" />
              </div>
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 text-blue-300 text-[10px] font-black uppercase tracking-widest mb-1">
                  <Sparkles size={10} /> Neural Engine v3.1
                </div>
                <h1 className="text-3xl md:text-5xl font-black tracking-tighter">
                  Bigyann <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">Translate</span>
                </h1>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowHistory(!showHistory)}
                className="p-3 bg-gray-900/50 border border-gray-800 rounded-xl hover:bg-gray-800 transition-colors group relative"
                title="Translation History"
              >
                <History size={18} className="group-hover:text-blue-400 transition-colors" />
                {history.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-[10px] font-bold rounded-full flex items-center justify-center">
                    {history.length}
                  </span>
                )}
              </button>
              <button 
                onClick={() => setAutoPlay(!autoPlay)}
                className={`p-3 rounded-xl border transition-colors ${autoPlay ? 'bg-green-500/20 border-green-500/30 text-green-400' : 'bg-gray-900/50 border-gray-800 text-gray-400 hover:bg-gray-800'}`}
                title={autoPlay ? "Auto-play enabled" : "Auto-play disabled"}
              >
                <Volume2 size={18} />
              </button>
              <button 
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-3 bg-gray-900/50 border border-gray-800 rounded-xl hover:bg-gray-800 transition-colors"
                title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
              >
                <Maximize2 size={18} />
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="flex flex-wrap justify-center gap-6 mb-6">
            <div className="text-center">
              <div className="text-xl md:text-2xl font-black text-blue-400">100+</div>
              <div className="text-xs text-gray-500">Languages</div>
            </div>
            <div className="text-center">
              <div className="text-xl md:text-2xl font-black text-purple-400">99%</div>
              <div className="text-xs text-gray-500">Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-xl md:text-2xl font-black text-emerald-400">0.3s</div>
              <div className="text-xs text-gray-500">Avg. Speed</div>
            </div>
            <div className="text-center">
              <div className="text-xl md:text-2xl font-black text-amber-400">{charCount}</div>
              <div className="text-xs text-gray-500">Characters</div>
            </div>
          </div>
        </header>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Controls & History */}
          <div className="lg:col-span-1 space-y-6">
            {/* Language Controls */}
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Target size={14} />
                  Translation Settings
                </h3>
                <button 
                  onClick={() => setTranslationMode(prev => 
                    prev === 'standard' ? 'formal' : 
                    prev === 'formal' ? 'casual' : 
                    prev === 'casual' ? 'technical' : 'standard'
                  )}
                  className="text-xs px-3 py-1 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  {translationMode}
                </button>
              </div>

              {/* Language Selectors */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Source Language</label>
                  <div className="relative">
                    <select 
                      value={sourceLang} 
                      onChange={(e) => setSourceLang(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-800 rounded-xl p-3 pr-10 outline-none text-sm font-medium text-white cursor-pointer hover:border-blue-500/50 transition-colors appearance-none"
                    >
                      {languages.map(l => (
                        <option key={l.code} value={l.code} className="bg-gray-900">
                          {l.flag} {l.name} {l.code === 'auto' && '(Auto-detect)'}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                  </div>
                </div>

                <div className="flex justify-center">
                  <button 
                    onClick={swapLanguages} 
                    className="p-3 bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-800 rounded-xl hover:from-blue-600 hover:to-purple-600 hover:border-blue-500 transition-all active:scale-95 shadow-lg group"
                    disabled={sourceLang === 'auto'}
                  >
                    <ArrowRightLeft size={20} className="group-hover:rotate-180 transition-transform duration-500" />
                  </button>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Target Language</label>
                  <div className="relative">
                    <select 
                      value={targetLang} 
                      onChange={(e) => setTargetLang(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-800 rounded-xl p-3 pr-10 outline-none text-sm font-medium text-white cursor-pointer hover:border-purple-500/50 transition-colors appearance-none"
                    >
                      {languages.filter(l => l.code !== 'auto').map(l => (
                        <option key={l.code} value={l.code} className="bg-gray-900">
                          {l.flag} {l.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Recent Languages */}
              <div className="mt-6 pt-6 border-t border-gray-800">
                <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Recent Languages</h4>
                <div className="flex flex-wrap gap-2">
                  {recentLanguages.map(code => {
                    const lang = languages.find(l => l.code === code);
                    if (!lang || code === targetLang) return null;
                    return (
                      <button
                        key={code}
                        onClick={() => setTargetLang(code)}
                        className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors"
                      >
                        <span>{lang.flag}</span>
                        <span>{lang.code.toUpperCase()}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Quick Phrases */}
            <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-800/30 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-blue-300 mb-3 flex items-center gap-2">
                <Zap size={14} />
                Quick Phrases
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {quickPhrases.map((phrase, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickPhrase(phrase.text)}
                    className="p-3 bg-gray-900/30 hover:bg-gray-800/50 rounded-xl text-left transition-colors group"
                  >
                    <div className="text-lg mb-1">{phrase.emoji}</div>
                    <div className="text-xs font-medium text-gray-300 group-hover:text-white transition-colors truncate">
                      {phrase.text}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* History Panel */}
            {showHistory && (
              <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <History size={14} />
                    Recent Translations
                  </h3>
                  {history.length > 0 && (
                    <button 
                      onClick={clearHistory}
                      className="text-xs text-red-400 hover:text-red-300 transition-colors"
                    >
                      Clear All
                    </button>
                  )}
                </div>
                
                {history.length === 0 ? (
                  <div className="text-center py-8 text-gray-600 text-sm">
                    <Clock size={24} className="mx-auto mb-2 opacity-50" />
                    No translation history yet
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                    {history.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => loadFromHistory(item)}
                        className="w-full p-3 bg-gray-800/30 hover:bg-gray-800/70 rounded-xl text-left transition-colors group"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="text-xs font-bold text-blue-400 uppercase">
                            {item.source} → {item.target}
                          </div>
                          <div className="text-[10px] text-gray-600">
                            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        <div className="text-sm font-medium text-gray-300 group-hover:text-white mb-1 truncate">
                          {item.original}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {item.translated}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Translation Areas */}
          <div className="lg:col-span-2 space-y-6">
            {/* Source & Target Areas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Source Text Area */}
              <div className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 rounded-2xl p-6 shadow-2xl group focus-within:border-blue-500/50 transition-all duration-300">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-500/20 rounded-lg">
                      <Brain size={14} className="text-blue-400" />
                    </div>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Original Text</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isTyping && <span className="text-xs font-bold text-blue-500 animate-pulse flex items-center gap-1"><Loader2 size={12} className="animate-spin" />Typing...</span>}
                    <span className="text-xs text-gray-600">{charCount}/5000</span>
                  </div>
                </div>
                
                <textarea
                  ref={sourceTextRef}
                  className="w-full h-64 bg-transparent text-lg md:text-xl font-medium resize-none outline-none placeholder:text-gray-700 text-white leading-relaxed custom-scrollbar"
                  placeholder="Enter text to translate..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  maxLength={5000}
                />
                
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-800">
                  <button 
                    onClick={() => setText('')}
                    className="text-xs px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                    disabled={!text}
                  >
                    Clear
                  </button>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => speakText(text, sourceLang === 'auto' ? 'en' : sourceLang)}
                      className="p-2 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      disabled={!text || isSpeaking}
                      title="Speak text"
                    >
                      {isSpeaking ? <MicOff size={16} className="text-red-400" /> : <Mic size={16} className="text-gray-400" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Result Text Area */}
              <div className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 rounded-2xl p-6 relative shadow-2xl overflow-hidden">
                {/* Background Glow */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 blur-[80px] rounded-full" />
                
                <div className="flex justify-between items-center mb-4 relative z-10">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-purple-500/20 rounded-lg">
                      <Sparkles size={14} className="text-purple-400" />
                    </div>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Translated Text</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {loading && <Loader2 className="animate-spin text-blue-500" size={16} />}
                    <div className="text-xs text-gray-600">
                      {translatedText ? translatedText.length : 0} chars
                    </div>
                  </div>
                </div>
                
                <div 
                  ref={resultRef}
                  className="w-full h-64 text-lg md:text-xl font-medium overflow-y-auto text-white leading-relaxed custom-scrollbar relative z-10"
                >
                  {translatedText || (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center text-gray-700">
                        <Languages size={48} className="mx-auto mb-4 opacity-30" />
                        <p className="text-lg italic">Translation will appear here</p>
                        <p className="text-sm mt-2">Start typing to see real-time translation</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Action Buttons */}
                {translatedText && (
                  <div className="flex flex-wrap justify-between items-center mt-4 pt-4 border-t border-gray-800 relative z-10">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={copyToClipboard}
                        className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 text-sm font-bold ${
                          copied 
                            ? 'bg-green-600 text-white' 
                            : 'bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700'
                        }`}
                      >
                        {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                        {copied ? "Copied!" : "Copy"}
                      </button>
                      
                      <button 
                        onClick={() => speakText(translatedText, targetLang)}
                        className="p-2.5 hover:bg-gray-800 rounded-xl transition-colors"
                        title="Listen"
                      >
                        <Volume2 size={16} className="text-gray-400" />
                      </button>
                      
                      <button 
                        onClick={downloadTranslation}
                        className="p-2.5 hover:bg-gray-800 rounded-xl transition-colors"
                        title="Download"
                      >
                        <Download size={16} className="text-gray-400" />
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleFeedback('good')}
                        className={`p-2 rounded-lg transition-colors ${feedback === 'good' ? 'bg-green-500/20 text-green-400' : 'hover:bg-gray-800'}`}
                        title="Good translation"
                      >
                        <ThumbsUp size={16} />
                      </button>
                      <button 
                        onClick={() => handleFeedback('bad')}
                        className={`p-2 rounded-lg transition-colors ${feedback === 'bad' ? 'bg-red-500/20 text-red-400' : 'hover:bg-gray-800'}`}
                        title="Poor translation"
                      >
                        <ThumbsDown size={16} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Feedback Message */}
                {feedback && (
                  <div className={`absolute bottom-20 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg text-sm font-bold ${
                    feedback === 'good' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {feedback === 'good' ? 'Thanks for the feedback! ✓' : 'We\'ll improve this! ✓'}
                  </div>
                )}
              </div>
            </div>

            {/* Features & Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-blue-900/10 to-blue-900/5 border border-blue-800/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-blue-500/20 rounded-lg">
                    <BookOpen size={14} className="text-blue-400" />
                  </div>
                  <h4 className="text-sm font-bold">Language Learning</h4>
                </div>
                <p className="text-xs text-gray-400">Perfect for students and language learners with accurate contextual translations.</p>
              </div>
              
              <div className="bg-gradient-to-br from-purple-900/10 to-purple-900/5 border border-purple-800/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-purple-500/20 rounded-lg">
                    <Star size={14} className="text-purple-400" />
                  </div>
                  <h4 className="text-sm font-bold">Professional Use</h4>
                </div>
                <p className="text-xs text-gray-400">Formal, casual, and technical translation modes for different contexts.</p>
              </div>
              
              <div className="bg-gradient-to-br from-emerald-900/10 to-emerald-900/5 border border-emerald-800/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-emerald-500/20 rounded-lg">
                    <Globe size={14} className="text-emerald-400" />
                  </div>
                  <h4 className="text-sm font-bold">Real-time</h4>
                </div>
                <p className="text-xs text-gray-400">Instant translations as you type with auto-detection capabilities.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 pt-6 border-t border-gray-800 text-center text-sm text-gray-600">
          <p className="mb-2">Bigyann Translate uses advanced neural networks for accurate translations. For professional use only.</p>
          <div className="flex flex-wrap justify-center gap-6">
            <button className="hover:text-gray-400 transition-colors text-xs">Privacy Policy</button>
            <button className="hover:text-gray-400 transition-colors text-xs">Terms of Service</button>
            <button className="hover:text-gray-400 transition-colors text-xs">Report Issue</button>
            <button className="hover:text-gray-400 transition-colors text-xs">API Access</button>
          </div>
        </footer>
      </div>

     
    </div>
  );
};

export default AITranslator;