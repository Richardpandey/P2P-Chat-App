import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import boyAvatar from "@/assets/boy.png";
import girlAvatar from "@/assets/girl.png";
import { Download, FileText, Play } from "lucide-react";
import { Message } from "./ChatApp";
import { useAuth } from "@/contexts/AuthContext";

interface MessageBubbleProps {
  message: Message;
  isMobile?: boolean;
  isFromBlockedUser?: boolean;
  remoteAvatar?: string;
  remoteGender?: 'male' | 'female';
}

export const MessageBubble = ({ message, isMobile = false, isFromBlockedUser = false, remoteAvatar, remoteGender }: MessageBubbleProps) => {
  const { user } = useAuth();
  const isCurrentUser = message.senderId === "current" || (!!user && message.senderId === user.nametag);

  const renderMessageContent = () => {
    switch (message.type) {
      case 'file':
        return (
          <div className={`flex items-center gap-3 p-3 ${isFromBlockedUser ? 'bg-red-100/10' : 'bg-muted/50'} rounded-lg`}>
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">{message.fileName}</p>
              <p className="text-xs text-muted-foreground">Document</p>
            </div>
            <Button variant="ghost" size="sm" disabled={isFromBlockedUser}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        );
      case 'audio':
        return (
          <div className={`flex items-center gap-3 p-3 ${isFromBlockedUser ? 'bg-red-100/10' : 'bg-muted/50'} rounded-lg`}>
            <Button variant="ghost" size="sm" className="rounded-full" disabled={isFromBlockedUser}>
              <Play className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full w-1/3 bg-primary rounded-full" />
              </div>
            </div>
            <span className="text-xs text-muted-foreground">0:23</span>
          </div>
        );
      default:
        return (
          <div>
            <p className="text-sm leading-relaxed">{message.content}</p>
            {isFromBlockedUser && (
              <div className="mt-1">
                <Badge variant="outline" className="text-xs text-destructive border-destructive/50">
                  Message from blocked user
                </Badge>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className={`flex gap-3 animate-message-slide-in ${isCurrentUser ? 'justify-end' : 'justify-start'} ${isMobile ? 'gap-2' : 'gap-3'}`}>
      {!isCurrentUser && (
        <Avatar className={`shrink-0 ${isMobile ? 'h-7 w-7' : 'h-8 w-8'}`}>
          <AvatarImage 
            src={remoteAvatar || (remoteGender ? (remoteGender === 'male' ? boyAvatar : girlAvatar) : undefined)}
          />
          <AvatarFallback className="bg-primary/10 text-primary text-xs">
            {message.content.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={`${isMobile ? 'max-w-[280px]' : 'max-w-xs lg:max-w-md xl:max-w-lg'} ${isCurrentUser ? 'order-1' : ''}`}>
        <div
          className={`rounded-2xl px-4 py-2 shadow-soft ${isMobile ? 'px-3 py-2' : 'px-4 py-2'} ${
            isCurrentUser
              ? 'bg-chat-message-sent text-chat-message-sent-foreground ml-auto'
              : 'bg-chat-message-received text-chat-message-received-foreground'
          }`}
        >
          {renderMessageContent()}
        </div>
        <div className={`flex items-center gap-2 mt-1 px-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
          <span className="text-xs text-muted-foreground">{message.timestamp}</span>
          {isCurrentUser && (
            <div className="flex gap-1">
              <div className="w-1 h-1 bg-primary rounded-full" />
              <div className="w-1 h-1 bg-primary rounded-full" />
            </div>
          )}
        </div>
      </div>

      {isCurrentUser && (
        <Avatar className={`shrink-0 order-2 ${isMobile ? 'h-7 w-7' : 'h-8 w-8'}`}>
          <AvatarImage src={user?.gender ? (user.gender === 'male' ? boyAvatar : girlAvatar) : undefined} />
          <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs">
            You
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};