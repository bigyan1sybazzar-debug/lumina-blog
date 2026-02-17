import React, { useState, useEffect, useRef } from 'react';
import { DirectMessage, User } from '../types';
import { db } from '../services/firebase';
import { sendDirectMessage, listenToDirectMessages } from '../services/chatService';
import { Send, Loader2, X, MessageCircle, Image as ImageIcon, Mic, StopCircle, Play, Pause } from 'lucide-react';
import { put } from '@vercel/blob';

interface DirectChatProps {
    currentUser: User;
    friend: User;
    onClose: () => void;
}

const DirectChat: React.FC<DirectChatProps> = ({ currentUser, friend, onClose }) => {
    const [messages, setMessages] = useState<DirectMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const [audioChunks, setAudioChunks] = useState<Blob[]>([]);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const handleSend = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!newMessage.trim()) return;

        const content = newMessage.trim();
        setNewMessage('');

        try {
            await sendDirectMessage(currentUser.id, friend.id, content);
        } catch (error) {
            console.error("Failed to send message", error);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        const file = e.target.files[0];
        setIsUploading(true);

        try {
            const response = await fetch(`/api/upload?filename=${file.name}`, {
                method: 'POST',
                body: file,
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Upload failed: ${response.status} ${errorText}`);
            }

            const newBlob = await response.json();

            await sendDirectMessage(currentUser.id, friend.id, '', {
                type: 'image',
                url: newBlob.url,
                mimeType: file.type
            });
        } catch (error) {
            console.error("Upload failed:", error);
            alert("Failed to upload image.");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            setMediaRecorder(recorder);

            const chunks: Blob[] = [];
            recorder.ondataavailable = (e) => chunks.push(e.data);
            recorder.onstop = async () => {
                const audioBlob = new Blob(chunks, { type: 'audio/webm' });
                await handleAudioUpload(audioBlob);
                stream.getTracks().forEach(track => track.stop());
            };

            recorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Could not access microphone.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorder && isRecording) {
            mediaRecorder.stop();
            setIsRecording(false);
            setMediaRecorder(null);
        }
    };

    const handleAudioUpload = async (audioBlob: Blob) => {
        setIsUploading(true);
        try {
            const filename = `voice-message-${Date.now()}.webm`;
            const response = await fetch(`/api/upload?filename=${filename}`, {
                method: 'POST',
                body: audioBlob,
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Upload failed: ${response.status} ${errorText}`);
            }

            const newBlob = await response.json();

            await sendDirectMessage(currentUser.id, friend.id, '', {
                type: 'audio',
                url: newBlob.url,
                mimeType: 'audio/webm'
            });
        } catch (error) {
            console.error("Audio upload failed:", error);
            alert(`Failed to upload audio. Check console for details.`);
        } finally {
            setIsUploading(false);
        }
    };

    const renderMessageContent = (msg: DirectMessage) => {
        if (msg.type === 'image' && msg.mediaUrl) {
            return (
                <div className="space-y-1">
                    <img src={msg.mediaUrl} alt="Image" className="max-w-[200px] rounded-lg border border-white/10" />
                </div>
            );
        }
        if (msg.type === 'audio' && msg.mediaUrl) {
            return (
                <div className="flex items-center gap-2 min-w-[150px]">
                    <audio controls src={msg.mediaUrl} className="h-8 max-w-[200px]" />
                </div>
            );
        }
        return <p>{msg.content}</p>;
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
                            <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.senderId === currentUser.id
                                ? 'bg-primary-600 text-white rounded-tr-none'
                                : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-100 dark:border-gray-600 rounded-tl-none'
                                }`}>
                                {renderMessageContent(msg)}
                                <p className={`text-[10px] mt-1 opacity-60 ${msg.senderId === currentUser.id ? 'text-right' : 'text-left'}`}>
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Upload Progress */}
            {isUploading && (
                <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 text-xs text-primary-600 flex items-center justify-center animate-pulse">
                    <Loader2 size={12} className="animate-spin mr-2" /> Uploading media...
                </div>
            )}

            {/* Input */}
            <div className="p-3 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
                <form onSubmit={handleSend} className="flex items-center gap-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileUpload}
                    />

                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 text-gray-400 hover:text-primary-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                        title="Send Image"
                        disabled={isUploading || isRecording}
                    >
                        <ImageIcon size={20} />
                    </button>

                    <button
                        type="button"
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`p-2 rounded-xl transition-colors ${isRecording
                            ? 'text-red-500 bg-red-100 dark:bg-red-500/20 animate-pulse'
                            : 'text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                        title={isRecording ? "Stop Recording" : "Record Voice Message"}
                        disabled={isUploading}
                    >
                        {isRecording ? <StopCircle size={20} /> : <Mic size={20} />}
                    </button>

                    <input
                        type="text"
                        placeholder={isRecording ? "Recording..." : "Type a message..."}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        disabled={isRecording}
                        className="flex-1 bg-gray-50 dark:bg-gray-900 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none dark:text-white disabled:opacity-50"
                    />

                    <button
                        type="submit"
                        disabled={!newMessage.trim() || isRecording || isUploading}
                        className="p-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/20 disabled:opacity-50 disabled:shadow-none"
                    >
                        <Send size={18} />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default DirectChat;
