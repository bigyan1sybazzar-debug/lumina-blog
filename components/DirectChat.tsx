import React, { useState, useEffect, useRef } from 'react';
import { DirectMessage, User } from '../types';
import { db } from '../services/firebase';
import { sendDirectMessage, listenToDirectMessages } from '../services/chatService';
import { initiateCall } from '../services/videoService';
import { Send, Loader2, X, MessageCircle, Video } from 'lucide-react';

interface DirectChatProps {
    currentUser: User;
    friend: User;
    onClose: () => void;
}

const DirectChat: React.FC<DirectChatProps> = ({ currentUser, friend, onClose }) => {
    const [messages, setMessages] = useState<DirectMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const unsub = listenToDirectMessages(currentUser.id, friend.id, (msgs) => {
            setMessages(msgs);
            setIsLoading(false);
        });

        return () => unsub();
    }, [currentUser.id, friend.id]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const content = newMessage.trim();
        setNewMessage('');

        try {
            await sendDirectMessage(currentUser.id, friend.id, content);
        } catch (error) {
            console.error("Failed to send message", error);
        }
    };

    const handleStartVideoCall = async () => {
        try {
            const callId = await initiateCall(currentUser, friend);
            // Dispatch global event for the VideoCallModal
            const event = new CustomEvent('start-video-call', {
                detail: { callId, isCaller: true }
            });
            window.dispatchEvent(event);
        } catch (error) {
            alert('Failed to start video call');
            console.error(error);
        }
    };

    return (
        <div className="fixed bottom-4 right-4 w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col z-50 overflow-hidden h-[500px] animate-in slide-in-from-bottom-5">
            {/* Header */}
            <div className="p-4 bg-primary-600 flex justify-between items-center text-white">
                <div className="flex items-center space-x-3">
                    <img src={friend.avatar} className="w-8 h-8 rounded-full border border-white/20 object-cover" />
                    <div>
                        <p className="text-sm font-bold">{friend.name}</p>
                        <p className="text-[10px] opacity-80">Online</p>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={handleStartVideoCall}
                        className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                        title="Start Video Call"
                    >
                        <Video size={18} />
                    </button>
                    <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg">
                        <X size={18} />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900/50">
                {isLoading ? (
                    <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary-600" /></div>
                ) : messages.length === 0 ? (
                    <div className="text-center py-20 text-gray-500 text-sm">
                        <MessageCircle className="mx-auto mb-2 opacity-20" size={40} />
                        Say hello to {friend.name}!
                    </div>
                ) : (
                    messages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.senderId === currentUser.id
                                ? 'bg-primary-600 text-white rounded-tr-none'
                                : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-100 dark:border-gray-600 rounded-tl-none'
                                }`}>
                                {msg.content}
                                <p className={`text-[10px] mt-1 opacity-60 ${msg.senderId === currentUser.id ? 'text-right' : 'text-left'}`}>
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-3 border-t border-gray-100 dark:border-gray-700 flex space-x-2 bg-white dark:bg-gray-800">
                <input
                    type="text"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 bg-gray-50 dark:bg-gray-900 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none dark:text-white"
                />
                <button
                    type="submit"
                    className="p-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/20"
                >
                    <Send size={18} />
                </button>
            </form>
        </div>
    );
};

export default DirectChat;
