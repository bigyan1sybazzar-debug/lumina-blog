'use client';

import React, { useState, useEffect } from 'react';
import { Mail, Copy, RefreshCw, CheckCircle, ShieldCheck, Zap, Lock, Trash2, ShieldAlert, Inbox as InboxIcon, Loader2, X } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const TempMailTool: React.FC = () => {
  const [account, setAccount] = useState<{ address: string; token: string } | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<any | null>(null); // State for the popup
  const [loading, setLoading] = useState<boolean>(false);
  const [checkingMail, setCheckingMail] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const generateGmail = async () => {
    setLoading(true);
    setError(null);
    try {
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

      const tokenRes = await fetch('https://api.mail.tm/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, password }),
      });
      const tokenData = await tokenRes.json();

      setAccount({ address: accData.address, token: tokenData.token });
    } catch (err) {
      setError("Mail nodes are currently busy. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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

  // Fetch full message content when one is clicked
  const openMessage = async (msg: any) => {
    try {
      const res = await fetch(`https://api.mail.tm/messages/${msg.id}`, {
        headers: { 'Authorization': `Bearer ${account?.token}` },
      });
      const fullMsg = await res.json();
      setSelectedMessage(fullMsg);
    } catch (err) {
      console.error("Failed to load full message");
    }
  };

  useEffect(() => {
    generateGmail();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (account && !checkingMail) checkMessages();
    }, 10000);
    return () => clearInterval(interval);
  }, [account, checkingMail]);

  const copyToClipboard = () => {
    if (account) {
      navigator.clipboard.writeText(account.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0c10] text-gray-100 py-16 px-6 font-sans">
      <Helmet>
        <title>Gmail Temp Mail Pro | Bigyann Tools</title>
      </Helmet>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header and Generator Card (same as before) */}
        <header className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-black uppercase tracking-[0.2em] mb-6">
            <Zap size={14} className="fill-orange-500" /> System: Online
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-4 tracking-tighter text-white">
            Temp <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500 italic">Mail.</span>
          </h1>
        </header>

        <div className="bg-[#161b22] border border-gray-800 rounded-[2.5rem] p-6 md:p-10 mb-8 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <input
                readOnly
                value={loading ? "Generating..." : account?.address || ""}
                className="w-full h-20 bg-black/40 border-2 border-gray-800 rounded-3xl px-8 font-mono text-lg text-orange-50 outline-none"
              />
              <button onClick={copyToClipboard} className={`absolute right-3 top-1/2 -translate-y-1/2 p-4 rounded-2xl ${copied ? 'bg-green-600' : 'bg-gray-800'}`}>
                {copied ? <CheckCircle size={20} /> : <Copy size={20} />}
              </button>
            </div>
            <button onClick={generateGmail} className="h-20 px-10 bg-orange-600 rounded-3xl font-black transition-all flex items-center gap-3">
              {loading ? <Loader2 className="animate-spin" /> : <RefreshCw />} NEW
            </button>
          </div>
        </div>

        {/* Inbox Section */}
        <div className="bg-[#161b22] border border-gray-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
          <div className="p-8 border-b border-gray-800 flex justify-between items-center bg-white/[0.01]">
            <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-3 text-white">
              <InboxIcon size={18} className="text-orange-500" /> Inbox
            </h2>
            <button onClick={checkMessages} className="text-[10px] font-black text-orange-500 flex items-center gap-2">
              <RefreshCw size={14} className={checkingMail ? 'animate-spin' : ''} /> SYNCING
            </button>
          </div>

          <div className="min-h-[300px]">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-600 opacity-30 italic">
                <Mail size={40} className="mb-4" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">Waiting for mail...</p>
              </div>
            ) : (
              <div className="w-full divide-y divide-gray-800">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    onClick={() => openMessage(msg)} // Trigger Modal
                    className="p-8 hover:bg-white/[0.02] transition-colors cursor-pointer group"
                  >
                    <div className="flex justify-between text-[10px] font-black text-orange-500 uppercase mb-3">
                      <span>{typeof msg.from === 'object' ? msg.from.address : msg.from}</span>
                      <span className="text-gray-600">{new Date(msg.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <div className="text-lg font-bold text-gray-200">{msg.subject}</div>
                    <div className="mt-2 text-sm text-gray-500 line-clamp-1">{msg.intro}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* --- MESSAGE MODAL --- */}
        {selectedMessage && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
              onClick={() => setSelectedMessage(null)}
            />

            {/* Content Card */}
            <div className="relative w-full max-w-2xl bg-[#161b22] border border-gray-800 rounded-[2.5rem] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
              <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500/10 rounded-xl text-orange-500">
                    <Mail size={20} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Message Details</span>
                </div>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="p-2 hover:bg-gray-800 rounded-full transition-colors text-gray-500 hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-8 overflow-y-auto custom-scrollbar">
                <div className="mb-8">
                  <h3 className="text-2xl font-black text-white mb-2">{selectedMessage.subject}</h3>
                  <div className="flex flex-col gap-1 text-xs font-bold uppercase tracking-tight text-orange-500">
                    <span>From: {selectedMessage.from.address}</span>
                    <span className="text-gray-600">Date: {new Date(selectedMessage.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                {/* Email Body */}
                <div className="text-gray-300 leading-relaxed bg-black/20 p-6 rounded-3xl border border-gray-800/50 prose prose-invert max-w-none">
                  {/* If the API provides HTML, we render it safely */}
                  {selectedMessage.html ? (
                    <div dangerouslySetInnerHTML={{ __html: selectedMessage.html[0] }} />
                  ) : (
                    <p className="whitespace-pre-wrap">{selectedMessage.text}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Feature = ({ icon, label }: { icon: any, label: string }) => (
  <div className="flex flex-col items-center justify-center p-6 bg-[#161b22] border border-gray-800 rounded-3xl group">
    <div className="text-gray-600 group-hover:text-orange-500 mb-2">{icon}</div>
    <span className="text-[9px] font-black uppercase tracking-widest text-gray-600">{label}</span>
  </div>
);

export default TempMailTool;