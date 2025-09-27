import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Phone, Video, X } from "lucide-react";
import boyAvatar from "@/assets/boy.png";
import girlAvatar from "@/assets/girl.png";

type Gender = 'male' | 'female';

interface IncomingCallDialogProps {
  isOpen: boolean;
  callerName: string;
  callerAvatar?: string;
  callerGender?: Gender;
  isVideo: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export function IncomingCallDialog({
  isOpen,
  callerName,
  callerAvatar,
  callerGender = 'male',
  isVideo,
  onAccept,
  onDecline,
}: IncomingCallDialogProps) {
  const fallbackAvatar = callerGender === 'male' ? boyAvatar : girlAvatar;
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onDecline(); }}>
      {/* Inline keyframes to avoid global CSS changes */}
      <style>{`
        @keyframes popPulse {
          0% { transform: scale(0.98); box-shadow: 0 10px 30px rgba(0,0,0,0.08); }
          50% { transform: scale(1.02); box-shadow: 0 14px 40px rgba(0,0,0,0.12); }
          100% { transform: scale(0.98); box-shadow: 0 10px 30px rgba(0,0,0,0.08); }
        }
      `}</style>
      <DialogContent className="w-[300px] sm:w-[340px] rounded-2xl p-4 border border-border bg-background shadow-xl">
        {/* Animated header/body only */}
        <div className="animate-[popPulse_1.2s_ease-in-out_infinite]" style={{ willChange: 'transform' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-muted">
              {isVideo ? (
                <Video className="h-5 w-5" />
              ) : (
                <Phone className="h-5 w-5 rotate-[315deg]" />
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Incoming {isVideo ? 'video' : 'voice'} call</p>
              <h3 className="font-semibold">{callerName}</h3>
            </div>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={callerAvatar || fallbackAvatar} alt={callerName} />
              <AvatarFallback>
                {callerName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="text-sm text-muted-foreground">Answer the call?</div>
          </div>
        </div>

        {/* Static buttons (no animation) */}
        <div className="flex items-center justify-center gap-3 pt-1">
          <Button
            variant="destructive"
            className="rounded-full"
            onClick={onDecline}
          >
            <X className="h-4 w-4 mr-1" /> Decline
          </Button>
          <Button
            className="rounded-full bg-green-500 hover:bg-green-600 text-white"
            onClick={onAccept}
          >
            {isVideo ? <Video className="h-4 w-4 mr-1" /> : <Phone className="h-4 w-4 mr-1 rotate-[315deg]" />} Accept
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
