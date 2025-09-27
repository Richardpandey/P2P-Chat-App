import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import incomingRingtone from '@/assets/incoming.mp3';
import outgoingFallback from '@/assets/ssstik.io_1758454926345.mp3';
import { WebRTCService } from '@/services/WebRTCService';
import { useAuth } from './AuthContext';

interface CallState {
  isInCall: boolean;
  isCaller: boolean;
  remoteUser: string | null;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isIncoming: boolean;
  connectionState: string | null;
  callStartTime: number | null;
  remoteVideoEnabled: boolean;
}

interface CallContextType {
  callState: CallState;
  webrtc: WebRTCService | null;
  initiateCall: (userId: string, withVideo: boolean) => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: () => void;
  endCall: () => void;
  toggleAudio: () => void;
  toggleVideo: () => void;
  sendChat: (targetUserId: string, content: string) => void;
  addChatListener: (cb: (payload: { sender: string; content: string; timestamp: number }) => void) => void;
  removeChatListener: (cb: (payload: { sender: string; content: string; timestamp: number }) => void) => void;
  addPresenceListener: (cb: (payload: { userId: string; online: boolean }) => void) => void;
  removePresenceListener: (cb: (payload: { userId: string; online: boolean }) => void) => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

// WS URL is built from window.location.hostname dynamically to support LAN/mobile

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [webrtc, setWebrtc] = useState<WebRTCService | null>(null);
  const [pendingOffer, setPendingOffer] = useState<RTCSessionDescriptionInit | null>(null);
  const chatListeners = React.useRef(new Set<(payload: { sender: string; content: string; timestamp: number }) => void>());
  const [isDataChannelOpen, setIsDataChannelOpen] = useState(false);
  const remoteUserRef = useRef<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const presenceListeners = React.useRef(new Set<(payload: { userId: string; online: boolean }) => void>());
  const [callState, setCallState] = useState<CallState>({
    isInCall: false,
    isCaller: false,
    remoteUser: null,
    isVideoEnabled: true,
    isAudioEnabled: true,
    localStream: null,
    remoteStream: null,
    isIncoming: false,
    connectionState: null,
    callStartTime: null,
    remoteVideoEnabled: false,
  });

  // Ringtone audio refs
  const incomingAudioRef = useRef<HTMLAudioElement | null>(null);
  const outgoingAudioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio elements once
  useEffect(() => {
    try {
      incomingAudioRef.current = new Audio(incomingRingtone);
      incomingAudioRef.current.loop = true;
      incomingAudioRef.current.preload = 'auto';
      incomingAudioRef.current.volume = 0.8;
    } catch {}
    try {
      // Note: If you add src/assets/outgoing.mp3, swap to import it here.
      outgoingAudioRef.current = new Audio(outgoingFallback);
      outgoingAudioRef.current.loop = true;
      outgoingAudioRef.current.preload = 'auto';
      outgoingAudioRef.current.volume = 0.8;
    } catch {}
    return () => {
      try { incomingAudioRef.current?.pause(); } catch {}
      try { outgoingAudioRef.current?.pause(); } catch {}
    };
  }, []);

  const playIncomingTone = async () => {
    try { await incomingAudioRef.current?.play(); } catch {}
  };
  const stopIncomingTone = () => {
    try {
      if (incomingAudioRef.current) {
        incomingAudioRef.current.pause();
        incomingAudioRef.current.currentTime = 0;
      }
    } catch {}
  };
  const playOutgoingTone = async () => {
    try { await outgoingAudioRef.current?.play(); } catch {}
  };
  const stopOutgoingTone = () => {
    try {
      if (outgoingAudioRef.current) {
        outgoingAudioRef.current.pause();
        outgoingAudioRef.current.currentTime = 0;
      }
    } catch {}
  };

  // Initialize WebSocket connection
  useEffect(() => {
    if (user) {
  const host = window.location.hostname;
  const socket = new WebSocket(`ws://${host}:8081`);
      const rtcService = new WebRTCService();

      socket.onopen = () => {
        console.log('WebSocket connected, registering user:', user.nametag);
        socket.send(JSON.stringify({
          type: 'register',
          userId: user.nametag,
        }));
        wsRef.current = socket;
        
        // Add a global debug function to check connection
        (window as any).debugCall = {
          checkConnection: () => {
            console.log('WebSocket state:', ws?.readyState);
            console.log('User:', user?.nametag);
            console.log('Call state:', callState);
          },
          testCall: (targetUser: string) => {
            console.log('Testing call to:', targetUser);
            initiateCall(targetUser, true);
          }
        };
      };

      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      socket.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        wsRef.current = null;
      };

      socket.onmessage = async (event) => {
        const message = JSON.parse(event.data);
        console.log('Received WebSocket message:', message);
        
        switch (message.type) {
          case 'offer':
            console.log('Received call offer from:', message.sender, 'withVideo:', message.withVideo);
            console.log('Current call state before offer:', callState);
            // Store the offer and wait for user to accept
            setPendingOffer(message.data);
            setCallState(prev => {
              const newState = {
                ...prev,
                remoteUser: message.sender,
                isInCall: false,
                isCaller: false,
                isIncoming: true,
                isVideoEnabled: message.withVideo !== false,
              };
              console.log('Setting new call state after offer:', newState);
              return newState;
            });
            // Start incoming ringtone until user accepts/rejects
            playIncomingTone();
            break;
            
          case 'answer':
            await rtcService.handleAnswer(message.data);
            // Mark as connected after handling answer (for caller)
            setCallState(prev => ({ ...prev, isInCall: true, isIncoming: false }));
            // Stop outgoing tone once answered
            stopOutgoingTone();
            break;
            
          case 'iceCandidate':
            await rtcService.handleIceCandidate(message.data);
            break;

          case 'chat':
            chatListeners.current.forEach((cb) => {
              try { cb({ sender: message.sender, content: message.content, timestamp: message.timestamp }); } catch {}
            });
            break;

          case 'presence':
            presenceListeners.current.forEach((cb) => {
              try { cb({ userId: message.userId, online: !!message.online }); } catch {}
            });
            break;

          case 'reject':
            setPendingOffer(null);
            setCallState(prev => ({
              ...prev,
              isInCall: false,
              isIncoming: false,
              isCaller: false,
              remoteUser: null,
              connectionState: null,
              callStartTime: null,
              remoteVideoEnabled: false,
            }));
            rtcService.endCall();
            // Stop any tones on rejection
            stopIncomingTone();
            stopOutgoingTone();
            break;

          case 'hangup':
            setCallState(prev => ({
              ...prev,
              isInCall: false,
              isIncoming: false,
              remoteUser: null,
              localStream: null,
              remoteStream: null,
              connectionState: null,
              callStartTime: null,
              remoteVideoEnabled: false,
            }));
            rtcService.endCall();
            // Stop any tones on hangup
            stopIncomingTone();
            stopOutgoingTone();
            break;
        }
      };

      setWs(socket);
      setWebrtc(rtcService);

      return () => {
        socket.close();
        rtcService.endCall();
      };
    }
  }, [user]);

  // Handle WebRTC events
  useEffect(() => {
    if (webrtc) {
      const onLocalStream = (stream: MediaStream) => {
        const hasVideo = stream.getVideoTracks().length > 0;
        const videoEnabled = hasVideo && stream.getVideoTracks()[0].enabled;
        console.log('Local stream updated:', {
          hasVideoTrack: hasVideo,
          videoEnabled: videoEnabled,
          audioTracks: stream.getAudioTracks().length
        });
        setCallState(prev => ({ 
          ...prev, 
          localStream: stream,
          isVideoEnabled: videoEnabled
        }));
      };

      const onRemoteStream = (stream: MediaStream) => {
        const hasVideo = stream.getVideoTracks().length > 0;
        const videoEnabled = hasVideo && stream.getVideoTracks()[0].enabled;
        console.log('Remote stream updated:', {
          hasVideoTrack: hasVideo,
          videoEnabled: videoEnabled,
          audioTracks: stream.getAudioTracks().length
        });
        setCallState(prev => ({ 
          ...prev, 
          remoteStream: stream, 
          remoteVideoEnabled: videoEnabled 
        }));
      };

      const onRemoteStreamChanged = (stream: MediaStream) => {
        const hasVideo = stream.getVideoTracks().length > 0;
        const videoEnabled = hasVideo && stream.getVideoTracks()[0].enabled;
        console.log('Remote stream changed:', {
          hasVideoTrack: hasVideo,
          videoEnabled: videoEnabled
        });
        setCallState(prev => ({ 
          ...prev, 
          remoteVideoEnabled: videoEnabled 
        }));
      };

      const onConnectionStateChange = (state: string) => {
        setCallState(prev => ({ 
          ...prev, 
          connectionState: state,
          callStartTime: state === 'connected' && !prev.callStartTime ? Date.now() : prev.callStartTime
        }));
        if (state === 'connected') {
          stopIncomingTone();
          stopOutgoingTone();
        }
      };

      const onIce = (candidate: RTCIceCandidate) => {
        const sock = wsRef.current || ws;
        const target = remoteUserRef.current || callState.remoteUser;
        if (sock && sock.readyState === WebSocket.OPEN && target) {
          sock.send(JSON.stringify({
            type: 'iceCandidate',
            sender: user?.nametag,
            target,
            data: candidate,
          }));
        }
      };

      const onDCOpen = () => setIsDataChannelOpen(true);
      const onDCClose = () => setIsDataChannelOpen(false);
      const onDCMessage = (data: any) => {
        const content = typeof data === 'string' ? data : String(data);
        const sender = remoteUserRef.current || callState.remoteUser || 'peer';
        chatListeners.current.forEach((cb) => {
          try { cb({ sender, content, timestamp: Date.now() }); } catch {}
        });
      };

      webrtc.on('localStream', onLocalStream);
      webrtc.on('remoteStream', onRemoteStream);
      webrtc.on('iceCandidate', onIce);
      webrtc.on('connectionStateChange', onConnectionStateChange);
      webrtc.on('remoteStreamChanged', onRemoteStreamChanged);
      webrtc.on('dataChannelOpen', onDCOpen);
      webrtc.on('dataChannelClose', onDCClose);
      webrtc.on('message', onDCMessage);

      return () => {
        webrtc.off('localStream', onLocalStream);
        webrtc.off('remoteStream', onRemoteStream);
        webrtc.off('iceCandidate', onIce);
        webrtc.off('connectionStateChange', onConnectionStateChange);
        webrtc.off('remoteStreamChanged', onRemoteStreamChanged);
        webrtc.off('dataChannelOpen', onDCOpen);
        webrtc.off('dataChannelClose', onDCClose);
        webrtc.off('message', onDCMessage);
      };
    }
  }, [webrtc, ws, user, callState.remoteUser]);

  // Keep a ref of the current remote user for data channel messages
  useEffect(() => {
    remoteUserRef.current = callState.remoteUser;
  }, [callState.remoteUser]);

  const initiateCall = async (userId: string, withVideo: boolean) => {
    console.log('Initiating call to:', userId, 'withVideo:', withVideo);
    if (!webrtc || !ws) {
      console.error('WebRTC or WebSocket not initialized');
      return;
    }

    // Check for media permissions first
    try {
      const permissions = await Promise.all([
        navigator.permissions.query({ name: 'microphone' as PermissionName }),
        ...(withVideo ? [navigator.permissions.query({ name: 'camera' as PermissionName })] : [])
      ]);
      
      const deniedPermissions = permissions.filter(p => p.state === 'denied');
      if (deniedPermissions.length > 0) {
        alert('Please allow microphone and camera permissions to make calls');
        return;
      }
    } catch (e) {
      console.warn('Could not check permissions:', e);
    }

    // Always try to get media first for the caller
    try {
      await webrtc.startLocalStream(withVideo);
      console.log('Caller got local media successfully');
      
      // Update call state immediately to match the video setting
      setCallState(prev => ({ 
        ...prev, 
        isInCall: true, 
        isCaller: true, 
        remoteUser: userId,
        isVideoEnabled: withVideo
      }));
    } catch (e) {
      console.error('Caller failed to get media:', e);
      alert('Could not access your microphone/camera. Please check permissions and try again.');
      return;
    }

    const offer = await webrtc.createOffer();
    const sock = wsRef.current || ws;
    if ((sock?.readyState ?? WebSocket.CLOSED) !== WebSocket.OPEN) {
      console.error('WebSocket not connected, cannot send call offer');
      alert('Connection issue. Please refresh and try again.');
      return;
    }
    
    console.log('Sending call offer via WebSocket to:', userId);
    const callMessage = {
      type: 'offer',
      sender: user?.nametag,
      target: userId,
      data: offer,
      withVideo: withVideo
    };
    console.log('Call message:', callMessage);
    sock!.send(JSON.stringify(callMessage));

    // Start outgoing ringtone after initiating the call
    playOutgoingTone();
    // Don't update call state here anymore since we already did it above
  };  const acceptCall = async () => {
    if (!webrtc || !ws || !callState.remoteUser || !pendingOffer) return;
    
    // Always try to get media first for the receiver
    try {
      await webrtc.startLocalStream(callState.isVideoEnabled);
      console.log('Receiver got local media successfully');
    } catch (e) {
      console.error('Receiver failed to get media:', e);
      alert('Could not access your microphone/camera. Please check permissions.');
      return;
    }
    
    const answer = await webrtc.handleOffer(pendingOffer);
    ws.send(JSON.stringify({
      type: 'answer',
      sender: user?.nametag,
      target: callState.remoteUser,
      data: answer,
    }));
    setPendingOffer(null);
    setCallState(prev => ({ ...prev, isInCall: true, isIncoming: false }));
    // Stop incoming ringtone on accept
    stopIncomingTone();
  };

  const rejectCall = () => {
    if (ws && callState.remoteUser && user?.nametag) {
      ws.send(JSON.stringify({ type: 'reject', sender: user.nametag, target: callState.remoteUser }));
    }
    setCallState(prev => ({
      ...prev,
      isInCall: false,
      remoteUser: null,
      localStream: null,
      remoteStream: null,
      isIncoming: false,
      connectionState: null,
      callStartTime: null,
      remoteVideoEnabled: false,
    }));
    // Stop incoming ringtone on decline
    stopIncomingTone();
  };

  const endCall = () => {
    if (webrtc) {
      webrtc.endCall();
    }
    if (ws && callState.remoteUser && user?.nametag) {
      ws.send(JSON.stringify({ type: 'hangup', sender: user.nametag, target: callState.remoteUser }));
    }
    setCallState(prev => ({
      ...prev,
      isInCall: false,
      remoteUser: null,
      localStream: null,
      remoteStream: null,
      connectionState: null,
      callStartTime: null,
      remoteVideoEnabled: false,
    }));
    // Stop any tones on end
    stopIncomingTone();
    stopOutgoingTone();
  };

  const toggleAudio = () => {
    if (webrtc) {
      const isEnabled = webrtc.toggleAudio();
      setCallState(prev => ({ ...prev, isAudioEnabled: isEnabled }));
    }
  };

  const toggleVideo = async () => {
    if (webrtc && callState.localStream) {
      // Get current track state before toggling
      const videoTrack = callState.localStream.getVideoTracks()[0];
      const currentState = videoTrack ? videoTrack.enabled : false;
      
      console.log('Toggling video from', currentState, 'to', !currentState);
      const isEnabled = await webrtc.toggleVideo();
      
      // Update state immediately with the returned value
      setCallState(prev => ({ ...prev, isVideoEnabled: isEnabled }));
      
      console.log('Video toggle completed, new state:', isEnabled);
    }
  };

  const sendChat = (targetUserId: string, content: string) => {
    if (!content.trim() || !user?.nametag) return;
    // Prefer WebRTC data channel when in-call and data channel is open
    if (webrtc && isDataChannelOpen && callState.isInCall && callState.remoteUser === targetUserId) {
      try {
        webrtc.sendMessage(content);
        return;
      } catch {}
    }
    // Fallback to WebSocket signaling chat
    if (ws && ws.readyState === WebSocket.OPEN && targetUserId) {
      ws.send(JSON.stringify({
        type: 'chat',
        sender: user.nametag,
        target: targetUserId,
        content,
      }));
    }
  };

  const addChatListener = (cb: (payload: { sender: string; content: string; timestamp: number }) => void) => {
    chatListeners.current.add(cb);
  };

  const removeChatListener = (cb: (payload: { sender: string; content: string; timestamp: number }) => void) => {
    chatListeners.current.delete(cb);
  };

  const addPresenceListener = (cb: (payload: { userId: string; online: boolean }) => void) => {
    presenceListeners.current.add(cb);
  };

  const removePresenceListener = (cb: (payload: { userId: string; online: boolean }) => void) => {
    presenceListeners.current.delete(cb);
  };

  const value = {
    callState,
    webrtc,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleAudio,
    toggleVideo,
    sendChat,
    addChatListener,
    removeChatListener,
    addPresenceListener,
    removePresenceListener,
  };

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
};

export const useCall = () => {
  const context = useContext(CallContext);
  if (context === undefined) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};