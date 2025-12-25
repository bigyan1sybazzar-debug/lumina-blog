import React, { useState, useEffect } from 'react';
import { Mail, Copy, RefreshCw, CheckCircle, ShieldCheck, Zap, Lock, Trash2, ShieldAlert, Inbox as InboxIcon } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

// RapidAPI Credentials
const RAPID_API_KEY = 'b60d288a5dmsh589478213136d86p1ad513jsn354c232be7de';
const RAPID_API_HOST = 'temporary-gmail-account.p.rapidapi.com';

const TempMailTool: React.FC = () => {
  const [account, setAccount] = useState<{ address: string; token: string } | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [checkingMail, setCheckingMail] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [errorType, setErrorType] = useState<'CORS' | 'RATE_LIMIT' | null>(null);

  const generateGmail = async () => {
    setLoading(true);
    setMessages([]);
    setErrorType(null);
    
    try {
      // We use cors-anywhere or direct fetch. 
      // NOTE: For RapidAPI, direct fetch often works better if the provider allows it.
      const response = await fetch(`https://${RAPID_API_HOST}/get-account`, {
        method: 'GET',
        headers: {
          'x-rapidapi-key': RAPID_API_KEY,
          'x-rapidapi-host': RAPID_API_HOST,
        }
      });

      if (response.status === 429) {
        setErrorType('RATE_LIMIT');
        throw new Error('Rate limit exceeded');
      }

      if (!response.ok) throw new Error('API Blocked');
      
      const data = await response.json();
      setAccount({ address: data.address, token: data.token });
    } catch (err) {
      console.warn("CORS/API Blocked. Setting up Demo Identity.");
      if (!errorType) setErrorType('CORS');
      // Fallback Demo Account so the UI remains interactive
      setAccount({ 
        address: `bigyann_temp_${Math.random().toString(36).substring(7)}@gmail.com`, 
        token: "demo_token" 
      });
    } finally {
      setLoading(false);
    }
  };

  const checkMessages = async () => {
    if (!account || errorType === 'CORS') return;
    setCheckingMail(true);
    try {
      const response = await fetch(`https://${RAPID_API_HOST}/get-messages?address=${account.address}&token=${account.token}`, {
        method: 'GET',
        headers: {
          'x-rapidapi-key': RAPID_API_KEY,
          'x-rapidapi-host': RAPID_API_HOST,
        }
      });
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (err) {
      console.error("Inbox fetch failed");
    } finally {
      setCheckingMail(false);
    }
  };

  useEffect(() => {
    generateGmail();
  }, []);

  const copyToClipboard = () => {
    if (account) {
      navigator.clipboard.writeText(account.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0c10] text-gray-100 py-16 px-6 font-sans selection:bg-blue-500/30">
      <Helmet>
        <title>Gmail Temp Mail Pro | Bigyann Tools</title>
        <meta name="description" content="Generate instant, disposable Gmail accounts for ultimate privacy." />
      </Helmet>

      {/* Futuristic Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-6">
            <Zap size={14} className="fill-current" /> 100% Anonymous Gmail Nodes
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight">
            Temp Mail <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Pro.</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto font-medium">
            Stop giving out your real email. Use our disposable Gmail generator to bypass verification and keep your inbox clean.
          </p>
        </div>

        {/* Generator Card */}
        <div className="bg-[#161b22]/80 backdrop-blur-xl rounded-[2.5rem] border border-gray-800 shadow-2xl p-8 md:p-12 mb-8">
          <div className="space-y-6">
            <div className="relative group">
              <label className="absolute -top-3 left-6 px-2 bg-[#161b22] text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
                Assigned Gmail Address
              </label>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-grow relative">
                  <input 
                    readOnly 
                    value={loading ? "Handshaking with API..." : account?.address || ""}
                    className="w-full h-20 bg-black/40 border-2 border-gray-800 group-hover:border-blue-500/30 rounded-3xl px-8 font-mono text-xl md:text-2xl outline-none transition-all text-blue-100"
                  />
                  {!loading && (
                    <button 
                      onClick={copyToClipboard}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 p-4 rounded-2xl transition-all active:scale-90 ${copied ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-300'}`}
                    >
                      {copied ? <CheckCircle size={22} /> : <Copy size={22} />}
                    </button>
                  )}
                </div>
                <button 
                  onClick={generateGmail}
                  disabled={loading}
                  className="h-20 px-10 bg-blue-600 hover:bg-blue-500 text-white rounded-3xl font-black text-lg transition-all active:scale-95 flex items-center justify-center gap-3 shadow-lg shadow-blue-600/20"
                >
                  <RefreshCw className={loading ? 'animate-spin' : ''} size={24} />
                  New
                </button>
              </div>
            </div>

            {/* Error Notifications */}
            {errorType === 'CORS' && (
              <div className="flex items-start gap-3 text-amber-500 text-xs font-bold bg-amber-500/5 p-4 rounded-2xl border border-amber-500/10 leading-relaxed">
                <ShieldAlert size={18} className="shrink-0" />
                <span>Browser Security (CORS) is blocking direct API access. You are seeing a <b>Demo Identity</b>. To enable live Gmail, a backend proxy is required.</span>
              </div>
            )}
            {errorType === 'RATE_LIMIT' && (
              <div className="flex items-center gap-2 text-red-400 text-xs font-bold bg-red-400/5 p-4 rounded-2xl border border-red-400/10">
                <ShieldAlert size={16} /> Rate limit reached. Please wait 60 seconds before generating a new mail.
              </div>
            )}
          </div>
        </div>

        {/* Inbox Section */}
        <div className="bg-[#161b22]/80 backdrop-blur-xl rounded-[2.5rem] border border-gray-800 shadow-2xl overflow-hidden transition-all duration-500">
          <div className="p-8 border-b border-gray-800 flex justify-between items-center bg-white/[0.02]">
            <h2 className="text-xl font-black flex items-center gap-3">
              <InboxIcon size={24} className="text-blue-500" />
              Incoming Messages
            </h2>
            <button 
              onClick={checkMessages}
              disabled={checkingMail || errorType === 'CORS'}
              className="flex items-center gap-2 text-sm font-black text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-widest disabled:opacity-20"
            >
              <RefreshCw size={18} className={checkingMail ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>

          <div className="min-h-[300px]">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-600">
                <div className="w-16 h-16 bg-gray-800/20 rounded-full flex items-center justify-center mb-4 border border-gray-800">
                  <Mail size={24} className="opacity-30" />
                </div>
                <p className="font-bold text-gray-500 uppercase tracking-widest text-[10px]">Your inbox is currently empty</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {messages.map((msg, idx) => (
                  <div key={idx} className="p-8 hover:bg-white/[0.03] transition-all cursor-pointer group">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-black text-blue-400 text-sm tracking-tight">{msg.from}</span>
                      <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">{msg.date}</span>
                    </div>
                    <div className="text-lg font-bold text-gray-200 group-hover:text-white transition-colors">
                      {msg.subject}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Info Grid */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Feature icon={<Lock size={18} />} label="Encrypted" />
          <Feature icon={<Trash2 size={18} />} label="Auto-Delete" />
          <Feature icon={<ShieldCheck size={18} />} label="Anonymous" />
          <Feature icon={<RefreshCw size={18} />} label="No Limits" />
        </div>
      </div>
    </div>
  );
};

const Feature = ({ icon, label }: { icon: React.ReactNode, label: string }) => (
  <div className="flex flex-col items-center justify-center py-8 rounded-[2rem] bg-white/[0.03] border border-gray-800/50 hover:border-blue-500/20 transition-colors group">
    <div className="text-gray-500 group-hover:text-blue-500 transition-colors mb-3">{icon}</div>
    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 group-hover:text-gray-400">{label}</span>
  </div>
);

export default TempMailTool;