import React, { useState } from 'react';
import { Download, Youtube, Instagram, Twitter, Facebook, Play, CheckCircle, AlertCircle, Loader2, Link as LinkIcon, Smartphone } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const RAPID_API_KEY = 'b60d288a5dmsh589478213136d86p1ad513jsn354c232be7de';
const RAPID_API_HOST = 'social-media-video-downloder.p.rapidapi.com';

const VideoDownloader: React.FC = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const detectPlatform = (url: string) => {
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) return 'youtube';
    if (lowerUrl.includes('instagram.com')) return 'instagram';
    if (lowerUrl.includes('facebook.com') || lowerUrl.includes('fb.watch')) return 'facebook';
    if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) return 'twitter';
    if (lowerUrl.includes('tiktok.com')) return 'tiktok';
    return 'youtube';
  };

  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Using our local Vite proxy route /api-video
      const response = await fetch('/api-video/apidownload', {
        method: 'POST',
        headers: {
          'x-rapidapi-key': RAPID_API_KEY,
          'x-rapidapi-host': RAPID_API_HOST,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: url,
          plt: detectPlatform(url)
        })
      });

      if (!response.ok) {
        if (response.status === 403) throw new Error("API Key Invalid or Subscription Inactive.");
        if (response.status === 429) throw new Error("Too many requests. Wait a moment.");
        throw new Error("Failed to fetch video data.");
      }
      
      const data = await response.json();
      
      if (data.status === true || data.url || data.links) {
        setResult(data);
      } else {
        throw new Error(data.message || 'Video not found. Is it private?');
      }
    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0c10] text-gray-100 py-16 px-6 relative overflow-hidden">
      <Helmet>
        <title>Video Downloader | Bigyann</title>
      </Helmet>

      <div className="absolute top-[-5%] right-[-5%] w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full" />

      <div className="relative z-10 max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter leading-none">
            Video <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Grabber.</span>
          </h1>
          <p className="text-gray-400 text-lg">Fast, secure social media video downloads.</p>
        </div>

        <div className="bg-[#161b22]/80 backdrop-blur-xl rounded-[2.5rem] border border-gray-800 p-2 shadow-2xl mb-12">
          <form onSubmit={handleDownload} className="flex flex-col md:flex-row gap-2">
            <div className="flex-grow relative">
              <LinkIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
              <input
                type="text"
                placeholder="Paste link here..."
                className="w-full h-20 bg-transparent rounded-3xl pl-16 pr-8 text-xl outline-none"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
            <button
              disabled={loading}
              className="h-20 px-10 bg-blue-600 hover:bg-blue-500 text-white rounded-[1.8rem] font-black text-lg transition-all flex items-center justify-center gap-3"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Download size={24} />}
              <span>{loading ? 'Fetching...' : 'Get Video'}</span>
            </button>
          </form>
        </div>

        {result && (
          <div className="bg-[#161b22]/90 backdrop-blur-2xl rounded-[2.8rem] border border-gray-700/50 p-6 md:p-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex flex-col md:flex-row gap-10 items-center">
              <div className="w-full md:w-2/5 aspect-video bg-black rounded-[2rem] overflow-hidden relative shadow-2xl">
                 <img src={result.thumb || result.thumbnail || 'https://via.placeholder.com/400x225'} alt="Thumbnail" className="w-full h-full object-cover opacity-70" />
                 <Play className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/80" size={56} />
              </div>
              
              <div className="flex-grow text-center md:text-left space-y-6">
                <h3 className="text-2xl font-black text-white line-clamp-2">{result.title || "Ready to Download"}</h3>
                <a
                  href={result.url || (result.links && result.links[0]?.link)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex px-8 py-4 bg-white text-black hover:bg-blue-400 hover:text-white rounded-2xl font-black items-center gap-3 transition-all"
                >
                  <Download size={20} /> Download Now
                </a>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-4 p-6 bg-red-500/10 border border-red-500/20 rounded-[2rem] text-red-400 mt-6">
            <AlertCircle size={20} />
            <p className="font-bold">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoDownloader;