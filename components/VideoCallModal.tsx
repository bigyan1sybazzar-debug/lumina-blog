import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { listenForIncomingCalls, listenToCall, answerCall, rejectCall, endCall, updateCallWithOffer, addIceCandidate, listenForIceCandidates } from '../services/videoService';
import { Call } from '../types';
import { Phone, PhoneOff, Video, Mic, MicOff, VideoOff, Camera } from 'lucide-react';

const SERVERS = {
    iceServers: [
        {
            urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
        },
    ],
};

export const VideoCallModal: React.FC = () => {
    const { user } = useAuth();
    const [incomingCall, setIncomingCall] = useState<Call | null>(null);
    const [activeCall, setActiveCall] = useState<Call | null>(null);
    const [callStatus, setCallStatus] = useState<'idle' | 'incoming' | 'connecting' | 'connected'>('idle');

    // WebRTC Refs
    const peerConnection = useRef<RTCPeerConnection | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const ignoredCalls = useRef<Set<string>>(new Set());
    const activeCallRef = useRef<Call | null>(null); // Track activeCall for async callbacks
    const iceCandidateUnsubscribeRef = useRef<(() => void) | null>(null); // Track listener cleanup

    // Audio/Video State
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);

    // Sync Ref with State
    useEffect(() => {
        activeCallRef.current = activeCall;
    }, [activeCall]);

    // Track call status in ref for listeners
    const callStatusRef = useRef(callStatus);
    useEffect(() => { callStatusRef.current = callStatus; }, [callStatus]);

    // Listen for incoming calls
    useEffect(() => {
        if (!user) return;
        console.log("[VideoModal] Subscribing to incoming calls for user:", user.id);
        const unsubscribe = listenForIncomingCalls(user.id, (calls) => {
            // Filter out calls we've ignored/failed locally
            const validCalls = calls.filter(c => !ignoredCalls.current.has(c.id));

            // Use Ref to check status without re-running effect
            if (validCalls.length > 0 && callStatusRef.current === 'idle') {
                console.log("[VideoModal] Incoming call detected:", validCalls[0]);
                setIncomingCall(validCalls[0]);
                setCallStatus('incoming');
            }
        });
        return () => {
            console.log("[VideoModal] Unsubscribing from incoming calls");
            unsubscribe();
        }
    }, [user]); // Removed callStatus dependency to prevent churn

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => track.stop());
            }
            if (peerConnection.current) {
                peerConnection.current.close();
            }
        };
    }, []);

    const candidateQueue = useRef<RTCIceCandidate[]>([]);

    // Listen to active call status changes (e.g., remote end)
    useEffect(() => {
        if (!activeCall) return;
        const unsubscribe = listenToCall(activeCall.id, async (updatedCall) => {
            if (!updatedCall || updatedCall.status === 'ended' || updatedCall.status === 'rejected') {
                handleCleanup();
            } else if (updatedCall.status === 'connected' && callStatusRef.current === 'connecting') {
                setCallStatus('connected');
                // Ensure we update state to 'connected' immediately to stop spinner
            } else if (updatedCall.answer && !peerConnection.current?.currentRemoteDescription) {
                // Caller receives Answer
                const pc = peerConnection.current;
                if (pc) {
                    const remoteDesc = new RTCSessionDescription(updatedCall.answer);
                    await pc.setRemoteDescription(remoteDesc);

                    // Flush queued candidates
                    while (candidateQueue.current.length > 0) {
                        const candidate = candidateQueue.current.shift();
                        if (candidate) {
                            pc.addIceCandidate(candidate).catch(console.error);
                        }
                    }
                }
            }
        });
        return () => unsubscribe();
    }, [activeCall]); // Removed callStatus dependency to prevent re-subscriptions


    const setupWebrtc = async (constraints = { video: true, audio: true }) => {
        // PRE-CHECK: Secure Context Required
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            const errorMsg = "Camera access unavailable. This usually happens when testing on a Local IP (http://192...). Browsers require HTTPS or 'localhost' for video calls.";
            alert(errorMsg);
            throw new Error(errorMsg);
        }

        const pc = new RTCPeerConnection(SERVERS);
        peerConnection.current = pc;

        // Monitor Connection State
        pc.oniceconnectionstatechange = () => {
            console.log("ICE Connection State:", pc.iceConnectionState);
            if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
                console.error("ICE Connection Failed/Disconnected. Possible firewall or minimal STUN issues.");
                // handleCleanup(); // Optional: don't auto-close immediately, let them retry?
                // alert("Connection lost or failed.");
            }
        };

        try {
            // Get Local Stream
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            localStreamRef.current = stream;

            if (localVideoRef.current && constraints.video) {
                localVideoRef.current.srcObject = stream;
            }

            // Add Tracks to PC
            stream.getTracks().forEach(track => {
                pc.addTrack(track, stream);
            });
        } catch (e: any) {
            console.error("Media access error:", e, "Constraints:", constraints);

            // Fallback: If video is unavailable/in-use/missing, try Audio only
            const retryErrors = ['NotReadableError', 'TrackStartError', 'NotFoundError', 'OverconstrainedError', 'DevicesNotFoundError'];
            if (constraints.video && retryErrors.includes(e.name)) {
                console.warn(`Video failed (${e.name}). Falling back to Audio only.`);
                // alert("Camera unavailable or missing. Switching to Audio-only call."); // Removed blocking alert
                return setupWebrtc({ video: false, audio: true });
            }

            if (e.name === 'NotAllowedError') {
                alert("Permission denied. Please allow Camera/Microphone access.");
            } else {
                alert(`Could not start media: ${e.name}`);
            }
            throw e;
        }

        // Handle Remote Stream
        pc.ontrack = (event) => {
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = event.streams[0];
            }
        };

        // ICE Candidates
        pc.onicecandidate = (event) => {
            const currentCall = activeCallRef.current; // Use Ref to avoid stale closure
            if (event.candidate && currentCall) {
                console.log("[VideoModal] Found ICE Candidate. Sending...");
                addIceCandidate(currentCall.id, event.candidate.toJSON(), user?.id === currentCall.callerId ? 'caller' : 'receiver')
                    .catch(e => console.error("Error adding ICE candidate:", e));
            } else if (event.candidate) {
                console.warn("[VideoModal] Found ICE Candidate but 'activeCall' is missing inside callback!", { currentCall, activeCallState: activeCall });
            }
        };

        return pc;
    };

    const handleAcceptCall = async (e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (!incomingCall || !user) return;
        if (callStatus === 'connecting' || callStatus === 'connected') return; // Prevent double-accept

        setCallStatus('connecting');
        setActiveCall(incomingCall);
        activeCallRef.current = incomingCall; // Immediate update for callbacks
        setIncomingCall(null);

        try {
            const pc = await setupWebrtc();

            // Set Remote Description (Offer)
            if (incomingCall.offer) {
                await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);

                // Send Answer
                await answerCall(incomingCall.id, answer);

                // Listen for Remote ICE Candidates
                const unsubIce = listenForIceCandidates(incomingCall.id, 'caller', (candidate) => {
                    pc.addIceCandidate(new RTCIceCandidate(candidate))
                        .catch(e => console.error("Error adding remote ICE candidate:", e));
                });
                iceCandidateUnsubscribeRef.current = unsubIce;
            }

        } catch (err) {
            console.error("Error accepting call:", err);
            // More detailed logging if it's a media error
            if (err instanceof Error) {
                console.error("Accept call error details:", err.message, err.stack);
            }
            if (incomingCall) {
                ignoredCalls.current.add(incomingCall.id); // Stop re-ringing
                rejectCall(incomingCall.id).catch(console.error);
            }
            handleCleanup();
        }
    };

    const handleRejectCall = async (e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (incomingCall) {
            ignoredCalls.current.add(incomingCall.id); // Ignore locally immediately
            try {
                await rejectCall(incomingCall.id);
            } catch (error) {
                console.error("Failed to reject call on server:", error);
            } finally {
                setIncomingCall(null);
                setCallStatus('idle');
            }
        }
    };

    const handleEndCall = async () => {
        if (activeCall) {
            await endCall(activeCall.id);
            handleCleanup();
        }
    };

    const handleCleanup = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
        }
        if (peerConnection.current) {
            peerConnection.current.close();
            peerConnection.current = null;
        }
        if (iceCandidateUnsubscribeRef.current) {
            iceCandidateUnsubscribeRef.current();
            iceCandidateUnsubscribeRef.current = null;
        }
        setActiveCall(null);
        activeCallRef.current = null;
        setIncomingCall(null);
        setCallStatus('idle');
    };

    const toggleMute = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getAudioTracks().forEach(track => track.enabled = !track.enabled);
            setIsMuted(!isMuted);
        }
    };

    const toggleVideo = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getVideoTracks().forEach(track => track.enabled = !track.enabled);
            setIsVideoOff(!isVideoOff);
        }
    };

    // Listen for events used to TRIGGER a call (emitted from Profile)
    // For simplicity, we can use a custom event or context. 
    // BUT since this is a global modal, maybe we export a hook?
    // OR we just use window event for loose coupling since Profile is separate.
    useEffect(() => {
        const handleStartCall = async (e: CustomEvent) => {
            const { callId, isCaller } = e.detail;
            if (isCaller) {
                // We are the caller.
                // We need to fetch the call doc to get the ID, but actually we passed ID.
                // Wait, we generate ID in service.
                // Let's assume Profile calls service, gets ID, then fires event.

                // Fetch full call object to set active
                // Actually, we can just set partial activeCall with ID and wait for listener?
                const newCall = { id: callId, callerId: user!.id } as Call;
                setActiveCall(newCall);
                activeCallRef.current = newCall; // Immediate update
                setCallStatus('connecting');

                const pc = await setupWebrtc();
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);

                // Update call with Offer
                await updateCallWithOffer(callId, offer);

                // Listen for Answer (handled by main 'listenToCall' effect)

                // Listen for Remote ICE Candidates (Receiver)
                const unsubIce = listenForIceCandidates(callId, 'receiver', (candidate) => {
                    if (pc.remoteDescription) {
                        pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.error);
                    } else {
                        // Queue candidate if remote description not set
                        candidateQueue.current.push(new RTCIceCandidate(candidate));
                    }
                });
                iceCandidateUnsubscribeRef.current = unsubIce;
            }
        };

        window.addEventListener('start-video-call', handleStartCall as any);
        return () => window.removeEventListener('start-video-call', handleStartCall as any);
    }, [user]);


    if (callStatus === 'idle' && !incomingCall) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
            {/* Ringtone */}
            {callStatus === 'incoming' && (
                <audio src="https://assets.mixkit.co/active_storage/sfx/1359/1359-preview.mp3" autoPlay loop />
            )}

            {/* INCOMING CALL UI */}
            {callStatus === 'incoming' && incomingCall && (
                <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-2xl flex flex-col items-center animate-bounce-in">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-primary-500 mb-4 shadow-lg animate-pulse">
                        <img src={incomingCall.callerAvatar} alt={incomingCall.callerName} className="w-full h-full object-cover" />
                    </div>
                    <h3 className="text-2xl font-bold dark:text-white mb-1">{incomingCall.callerName}</h3>
                    <p className="text-gray-500 mb-8 animate-pulse">Incoming Video Call...</p>
                    <div className="flex gap-8">
                        <button type="button" onClick={handleRejectCall} className="p-4 bg-red-500 text-white rounded-full hover:bg-red-600 transition-transform hover:scale-110 shadow-lg">
                            <PhoneOff size={32} />
                        </button>
                        <button type="button" onClick={handleAcceptCall} className="p-4 bg-green-500 text-white rounded-full hover:bg-green-600 transition-transform hover:scale-110 shadow-lg animate-bounce">
                            <Phone size={32} />
                        </button>
                    </div>
                </div>
            )}

            {/* ACTIVE CALL UI */}
            {(callStatus === 'connected' || callStatus === 'connecting') && (
                <div className="relative w-full h-full max-w-5xl max-h-[800px] flex flex-col bg-gray-900 rounded-3xl overflow-hidden shadow-2xl border border-gray-800 m-4">
                    {/* Remote Video (Full Size) */}
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover bg-gray-800"
                    />

                    {/* Local Video (PiP) */}
                    <div className="absolute top-4 right-4 w-48 h-36 bg-black rounded-xl overflow-hidden shadow-xl border-2 border-white/20">
                        <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                        />
                    </div>

                    {/* Controls */}
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-6 p-4 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10">
                        <button type="button" onClick={toggleMute} className={`p-4 rounded-full transition-colors ${isMuted ? 'bg-red-500 text-white' : 'bg-gray-700/80 text-white hover:bg-gray-600'}`}>
                            {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                        </button>
                        <button type="button" onClick={toggleVideo} className={`p-4 rounded-full transition-colors ${isVideoOff ? 'bg-red-500 text-white' : 'bg-gray-700/80 text-white hover:bg-gray-600'}`}>
                            {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
                        </button>
                        <button type="button" onClick={handleEndCall} className="p-4 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-lg">
                            <PhoneOff size={24} />
                        </button>
                    </div>

                    {callStatus === 'connecting' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-10">
                            <div className="text-white text-xl font-bold animate-pulse">Connecting...</div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
