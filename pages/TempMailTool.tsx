import React, { useState, useEffect } from 'react';
import { Mail, Copy, RefreshCw, CheckCircle, ShieldCheck, Zap, Lock, Trash2, ShieldAlert, Inbox as InboxIcon, Loader2 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const TempMailTool: React.FC = () => {
  const [account, setAccount] = useState<{ address: string; token: string } | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [checkingMail, setCheckingMail] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ GENERATE ACCOUNT via Proxy
  const generateGmail = async () => {
    setLoading(true);
    setError(null);
    try {
      // Generate a random email on their public domain
      const domainRes = await fetch('https://api.mail.tm/domains');
      const domainData = await domainRes.json();
      const domain = domainData['hydra:member'][0].domain;
      
      const address = `user${Math.random().toString(36).substring(7)}@${domain}`;
      const password = 'password123';
  
      const accountRes = await fetch('https://api.mail.tm/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, password }),
      });
      
      const accData = await accountRes.json();
      
      // Get Token
      const tokenRes = await fetch('https://api.mail.tm/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, password }),
      });
      const tokenData = await tokenRes.json();
  
      setAccount({ address: accData.address, token: tokenData.token });
    } catch (err) {
      setError("Mail nodes are busy. Try again.");
    } finally {
      setLoading(false);
    }
  };
  
  // 2. Replace your checkMessages with this:
  const checkMessages = async () => {
    if (!account) return;
    setCheckingMail(true);
    try {
      const res = await fetch('https://api.mail.tm/messages', {
        headers: { 'Authorization': `Bearer ${account.token}` },
      });
      const data = await res.json();
      setMessages(data['hydra:member'] || []);
    } catch (err) {
      console.error("Inbox sync failed");
    } finally {
      setCheckingMail(false);
    }
  };
  // Auto-generate on mount
  useEffect(() => {
    generateGmail();
  }, []);

  // Periodic check for new mail every 10 seconds if account exists
  useEffect(() => {
    const interval = setInterval(() => {
      if (account && !checkingMail) checkMessages();
    }, 10000);
    return () => clearInterval(interval);
  }, [account]);

  const copyToClipboard = () => {
    if (account) {
      navigator.clipboard.writeText(account.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0c10] text-gray-100 py-16 px-6 font-sans selection:bg-orange-500/30">
      <Helmet>
        <title>Gmail Temp Mail Pro | Bigyann Tools</title>
        <meta name="description" content="Secure, disposable Gmail inbox for private verification." />
      </Helmet>

      <div className="max-w-4xl mx-auto relative z-10">
        <header className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-black uppercase tracking-[0.2em] mb-6">
            <Zap size={14} className="fill-orange-500" /> Live Gmail Node Active
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-4 tracking-tighter">
            Temp <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">Mail.</span>
          </h1>
          <p className="text-gray-500 max-w-lg mx-auto text-sm font-medium">
            Generate an anonymous Gmail address to receive OTPs and confirmations without compromising your real identity.
          </p>
        </header>

        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-xs font-bold">
            <ShieldAlert size={18} /> {error}
          </div>
        )}

        {/* Address Generator Card */}
        <div className="bg-[#161b22] border border-gray-800 rounded-[2.5rem] p-6 md:p-10 mb-8 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full group">
              <label className="absolute -top-2.5 left-6 px-2 bg-[#161b22] text-[9px] font-black text-gray-500 uppercase tracking-widest z-10">
                Your Temporary Gmail
              </label>
              <input 
                readOnly 
                value={loading ? "Connecting to Gmail nodes..." : account?.address || ""}
                className="w-full h-20 bg-black/40 border-2 border-gray-800 group-hover:border-orange-500/30 rounded-3xl px-8 font-mono text-lg md:text-xl outline-none transition-all text-orange-50"
              />
              <button 
                onClick={copyToClipboard}
                disabled={loading}
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-4 rounded-2xl transition-all active:scale-90 ${copied ? 'bg-green-600' : 'bg-gray-800 hover:bg-gray-700'} disabled:opacity-30`}
              >
                {copied ? <CheckCircle size={20} /> : <Copy size={20} />}
              </button>
            </div>
            
            <button 
              onClick={generateGmail}
              disabled={loading}
              className="h-20 px-10 bg-orange-600 hover:bg-orange-500 text-white rounded-3xl font-black transition-all active:scale-95 flex items-center gap-3 w-full md:w-auto justify-center shadow-lg shadow-orange-600/20"
            >
              {loading ? <Loader2 className="animate-spin" /> : <RefreshCw />}
              NEW MAIL
            </button>
          </div>
        </div>

        {/* Inbox Display */}
        <div className="bg-[#161b22] border border-gray-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
          <div className="p-8 border-b border-gray-800 flex justify-between items-center bg-white/[0.01]">
            <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
              <div className="relative">
                <InboxIcon size={20} className="text-orange-500" />
                {!loading && <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
              </div>
              Inbox
            </h2>
            <button 
              onClick={checkMessages}
              disabled={checkingMail || !account}
              className="text-[10px] font-black text-orange-500 hover:text-orange-400 disabled:opacity-20 flex items-center gap-2 tracking-[0.2em]"
            >
              <RefreshCw size={14} className={checkingMail ? 'animate-spin' : ''} /> REFRESHING...
            </button>
          </div>

          <div className="min-h-[300px] flex flex-col items-center justify-center">
            {messages.length === 0 ? (
              <div className="text-center p-12">
                <div className="w-16 h-16 bg-gray-800/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-800/50">
                   <Mail size={24} className="text-gray-700" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600 italic">
                  Listening for incoming emails...
                </p>
              </div>
            ) : (
              <div className="w-full divide-y divide-gray-800">
                {messages.map((msg, i) => (
                  <div key={i} className="p-8 hover:bg-white/[0.02] transition-colors cursor-pointer group">
                    <div className="flex justify-between text-[10px] font-black text-orange-500 uppercase mb-3 tracking-widest">
                      <span className="group-hover:text-orange-400 transition-colors">{msg.from}</span>
                      <span className="text-gray-600">{msg.date}</span>
                    </div>
                    <div className="text-lg font-bold text-gray-200 group-hover:text-white transition-colors">{msg.subject}</div>
                    <div className="mt-2 text-sm text-gray-500 line-clamp-1">{msg.body?.replace(/<[^>]*>/g, '')}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Feature icon={<Lock size={16} />} label="SSL Encrypted" />
          <Feature icon={<Trash2 size={16} />} label="Auto-Destroy" />
          <Feature icon={<ShieldCheck size={16} />} label="Zero Tracking" />
          <Feature icon={<Zap size={16} />} label="Instant Sync" />
        </div>
      </div>
    </div>
  );
};

const Feature = ({ icon, label }: { icon: any, label: string }) => (
  <div className="flex flex-col items-center justify-center p-6 bg-[#161b22] border border-gray-800/50 rounded-3xl group hover:border-orange-500/20 transition-all">
    <div className="text-gray-600 group-hover:text-orange-500 transition-colors mb-2">{icon}</div>
    <span className="text-[9px] font-black uppercase tracking-widest text-gray-600 group-hover:text-gray-400">{label}</span>
  </div>
);

export default TempMailTool;