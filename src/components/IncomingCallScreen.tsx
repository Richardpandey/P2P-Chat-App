import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Phone, Video, X, Mic } from "lucide-react";
import boyAvatar from "@/assets/boy.png";
import girlAvatar from "@/assets/girl.png";

interface IncomingCallScreenProps {
  caller: {
    name: string;
    avatar?: string;
    gender: 'male' | 'female';
  };
  isVideo: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export const IncomingCallScreen = ({ 
  caller, 
  isVideo, 
  onAccept, 
  onDecline 
}: IncomingCallScreenProps) => {
  const [isMuted, setIsMuted] = useState(false);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-red-500/5 to-background backdrop-blur-xl flex flex-col items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-red-500/[0.08] via-transparent to-transparent pointer-events-none" />
      
      {/* Caller Info */}
      <div className="flex flex-col items-center gap-6 mb-12">
        <div className="relative">
          <Avatar className="h-32 w-32 border-4 border-primary/10">
            <AvatarImage 
              src={caller.avatar || (caller.gender === 'male' ? boyAvatar : girlAvatar)} 
              alt={caller.name} 
            />
            <AvatarFallback className="bg-primary/10 text-primary text-4xl">
              {caller.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="absolute inset-0 animate-pulse-ring" />
        </div>
        
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold">{caller.name}</h2>
          <p className="text-muted-foreground">
            {isVideo ? "Incoming video call..." : "Incoming call..."}
          </p>
        </div>
      </div>

      {/* Call Actions */}
      <div className="flex items-center gap-6">
        <Button
          size="lg"
          variant="destructive"
          className="h-16 w-16 rounded-full p-0 hover:bg-destructive/90 transition-transform hover:scale-105"
          onClick={onDecline}
        >
          <X className="h-8 w-8" />
        </Button>

        <Button
          size="lg"
          variant="outline"
          className={`h-12 w-12 rounded-full p-0 ${
            isMuted ? "bg-destructive/10 text-destructive" : ""
          }`}
          onClick={() => setIsMuted(!isMuted)}
        >
          <Mic className="h-6 w-6" />
        </Button>

        <Button
          size="lg"
          className="h-16 w-16 rounded-full p-0 bg-green-500 hover:bg-green-600 transition-transform hover:scale-105"
          onClick={onAccept}
        >
          {isVideo ? (
            <Video className="h-8 w-8 text-white" />
          ) : (
            <Phone className="h-8 w-8 text-white" />
          )}
        </Button>
      </div>
    </div>
  );
};