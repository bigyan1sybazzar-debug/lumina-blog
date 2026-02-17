import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { MessageSquare, X } from 'lucide-react';

export const GlobalListener: React.FC = () => {
    const { user } = useAuth();
    const isInitialLoad = useRef(true);
    const knownMessageIds = useRef<Set<string>>(new Set());
    const [latestNotification, setLatestNotification] = useState<{ id: string, sender: string, content: string } | null>(null);

    useEffect(() => {
        if (!user) return;

        console.log("Global Listener Active for:", user.name);

        const unsubMessages = db.collection('direct_messages')
            .where('participants', 'array-contains', user.id)
            .orderBy('timestamp', 'desc')
            .limit(5)
            .onSnapshot(snapshot => {
                // Initial load filtering
                if (isInitialLoad.current) {
                    snapshot.docs.forEach(doc => knownMessageIds.current.add(doc.id));
                    return;
                }

                const newChanges = snapshot.docChanges().filter(c => c.type === 'added');

                newChanges.forEach(change => {
                    const data = change.doc.data();
                    const msgId = change.doc.id;

                    // Skip if known or from self
                    if (knownMessageIds.current.has(msgId) || data.senderId === user.id) return;

                    // It's a NEW incoming message!
                    console.log("Global: New Incoming Message!", data);

                    // 1. Play Sound
                    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                    audio.play().catch(e => console.error("Audio playback failed:", e));

                    // 2. Show Toast
                    setLatestNotification({
                        id: msgId,
                        sender: 'Incoming Signal', // In real app, fetch sender name
                        content: data.content
                    });

                    // Add to known
                    knownMessageIds.current.add(msgId);
                });
            });

        // Lift initial load gate after 2s
        setTimeout(() => { isInitialLoad.current = false; }, 2000);

        return () => unsubMessages();
    }, [user]);

    if (!latestNotification) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
            <div className="bg-gray-900 border border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.5)] rounded-2xl p-4 w-80 relative overflow-hidden group">
                {/* Background FX */}
                <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                <button
                    onClick={() => setLatestNotification(null)}
                    className="absolute top-2 right-2 text-gray-400 hover:text-white transition-colors"
                >
                    <X size={14} />
                </button>

                <div className="flex items-start gap-4 relaitve z-10">
                    <div className="p-3 bg-blue-600 rounded-xl shadow-lg">
                        <MessageSquare size={20} className="text-white animate-pulse" />
                    </div>
                    <div>
                        <h4 className="text-white font-bold text-sm tracking-wide">INCOMING TRANSMISSION</h4>
                        <p className="text-blue-200 text-xs mt-1 line-clamp-2 leading-relaxed">
                            {latestNotification.content}
                        </p>
                    </div>
                </div>

                {/* Progress Bar (Auto dismiss visual) */}
                <div className="absolute bottom-0 left-0 h-1 bg-blue-500 animate-[width_3s_linear_forwards]"
                    onAnimationEnd={() => setLatestNotification(null)}
                    style={{ width: '100%' }}
                ></div>
            </div>
        </div>
    );
};
