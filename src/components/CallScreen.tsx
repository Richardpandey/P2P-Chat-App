import React, { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Phone, Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';
import { useCall } from '@/contexts/CallContext';
import { useCallTimer } from '@/hooks/use-call-timer';
import boy from '@/assets/boy.png';
import girl from '@/assets/girl.png';

interface CallScreenProps {
  remoteUser: {
    id: string;
    name: string;
    avatar?: string;
    gender?: 'male' | 'female';
  };
  onEndCall: () => void;
}

export const CallScreen: React.FC<CallScreenProps> = ({ remoteUser, onEndCall }) => {
  const { callState, toggleAudio, toggleVideo } = useCall();
  const callTimer = useCallTimer(callState.callStartTime);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  const handleToggleVideo = async () => {
    await toggleVideo();
  };

  // Derive local video enabled state directly from the track to avoid stale UI
  const localHasVideoTrack = !!callState.localStream && callState.localStream.getVideoTracks().length > 0;
  const localTrackEnabled = localHasVideoTrack ? callState.localStream!.getVideoTracks()[0].enabled : false;

  // Set up video streams
  useEffect(() => {
    if (localVideoRef.current && callState.localStream && localTrackEnabled) {
      localVideoRef.current.srcObject = callState.localStream;
      localVideoRef.current.muted = true; // Always mute local video to prevent feedback
      // Ensure local video plays
      localVideoRef.current.play().catch(e => console.error('Error playing local video:', e));
    }
  }, [callState.localStream, localTrackEnabled]);

  useEffect(() => {
    if (remoteVideoRef.current && callState.remoteStream) {
      remoteVideoRef.current.srcObject = callState.remoteStream;
      remoteVideoRef.current.muted = false; // Don't mute remote video - we want to hear the audio
      // Ensure video plays
      remoteVideoRef.current.play().catch(e => console.error('Error playing remote video:', e));
    }
    
    // Also set up dedicated audio element for better audio handling
    if (remoteAudioRef.current && callState.remoteStream) {
      remoteAudioRef.current.srcObject = callState.remoteStream;
      remoteAudioRef.current.play().catch(e => console.error('Error playing remote audio:', e));
    }
  }, [callState.remoteStream]);

  const getAvatarSrc = (gender: 'male' | 'female' | undefined, avatar?: string) => {
    if (avatar && avatar !== '/placeholder.svg') return avatar;
    return gender === 'female' ? girl : boy;
  };

  return (
    <div className="fixed inset-0 bg-black z-[100] flex flex-col">
      {/* Hidden audio element for reliable audio playback */}
      <audio
        ref={remoteAudioRef}
        autoPlay
        playsInline
        className="hidden"
      />
      
      {/* Header with user info and timer */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/70 to-transparent p-6">
        <div className="flex flex-col items-center text-white">
          <img
            src={getAvatarSrc(remoteUser.gender, remoteUser.avatar)}
            alt={remoteUser.name}
            className="w-16 h-16 rounded-full border-2 border-white/20 mb-2"
          />
          <h2 className="text-xl font-semibold">{remoteUser.name}</h2>
          <p className="text-sm text-white/80">{callTimer}</p>
        </div>
      </div>

      {/* Video Area */}
      <div className="flex-1 relative">
        {/* Remote Video (Main) */}
        {callState.remoteStream && callState.remoteVideoEnabled ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            muted={false}
            className="w-full h-full object-cover"
          />
        ) : callState.remoteStream ? (
          // Remote video disabled - show avatar but still play audio through hidden video element
          <>
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              muted={false}
              className="hidden"
            />
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
              <div className="text-center text-white">
                <img
                  src={getAvatarSrc(remoteUser.gender, remoteUser.avatar)}
                  alt={remoteUser.name}
                  className="w-40 h-40 rounded-full mx-auto mb-6 border-4 border-white/20 shadow-2xl"
                />
                <h3 className="text-2xl font-semibold mb-2">{remoteUser.name}</h3>
                <p className="text-lg text-white/80">
                  {callState.remoteStream.getVideoTracks().length === 0 ? 'Audio call' : 'Camera turned off'}
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
            <div className="text-center text-white">
              <img
                src={getAvatarSrc(remoteUser.gender, remoteUser.avatar)}
                alt={remoteUser.name}
                className="w-40 h-40 rounded-full mx-auto mb-6 border-4 border-white/20 shadow-2xl"
              />
              <h3 className="text-2xl font-semibold mb-2">{remoteUser.name}</h3>
              <p className="text-lg text-white/80">Connecting...</p>
            </div>
          </div>
        )}

        {/* Local Video (Picture-in-Picture) - Show if video track exists and is enabled */}
        {localHasVideoTrack && localTrackEnabled && (
          <div className="absolute top-20 right-4 w-32 h-40 bg-gray-800 rounded-lg overflow-hidden border-2 border-white/20">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform scale-x-[-1]" // Mirror local video
            />
          </div>
        )}

        {/* Local Video Off Indicator - Show when video is disabled */}
        {localHasVideoTrack && !localTrackEnabled && (
          <div className="absolute top-20 right-4 w-32 h-40 bg-gray-800 rounded-lg overflow-hidden border-2 border-white/20 flex items-center justify-center">
            <div className="text-center">
              <VideoOff className="h-8 w-8 text-white/60 mx-auto mb-1" />
              <p className="text-xs text-white/60">You turned off camera</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
        <div className="flex justify-center items-center gap-6">
          {/* Audio Toggle */}
          <Button
            size="lg"
            variant={callState.isAudioEnabled ? "secondary" : "destructive"}
            className="w-14 h-14 rounded-full p-0"
            onClick={toggleAudio}
          >
            {callState.isAudioEnabled ? (
              <Mic className="h-6 w-6" />
            ) : (
              <MicOff className="h-6 w-6" />
            )}
          </Button>

          {/* End Call */}
          <Button
            size="lg"
            variant="destructive"
            className="w-16 h-16 rounded-full p-0 bg-red-500 hover:bg-red-600"
            onClick={onEndCall}
          >
            <PhoneOff className="h-7 w-7" />
          </Button>

          {/* Video Toggle */}
          <Button
            size="lg"
            variant={localTrackEnabled ? "secondary" : "destructive"}
            className="w-14 h-14 rounded-full p-0"
            onClick={handleToggleVideo}
          >
            {localTrackEnabled ? (
              <Video className="h-6 w-6" />
            ) : (
              <VideoOff className="h-6 w-6" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};