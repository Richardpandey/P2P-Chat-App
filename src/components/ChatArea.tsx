import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import boyAvatar from "@/assets/boy.png";
import girlAvatar from "@/assets/girl.png";
import { Input } from "@/components/ui/input";
// import { CallDialog } from "./CallDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Phone, 
  Video, 
  MoreVertical, 
  Send, 
  Plus, 
  Paperclip, 
  Image as ImageIcon,
  FileText,
  Mic,
  ArrowLeft,
  Ban
} from "lucide-react";
import { Contact, Message } from "./ChatApp";
import { useCall } from "@/contexts/CallContext";
import { MessageBubble } from "./MessageBubble";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChatAreaProps {
  selectedContact: Contact | null;
  messages: Message[];
  onSendMessage: (content: string, type?: 'text' | 'file', fileUrl?: string, fileName?: string) => void;
  onBlockUser: (userId: string) => void;
  onDeleteChat: (userId: string) => void;
  isMobile: boolean;
  onBackToContacts: () => void;
}

export const ChatArea = ({ selectedContact, messages, onSendMessage, onBlockUser, onDeleteChat, isMobile, onBackToContacts }: ChatAreaProps) => {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  // const [showCallDialog, setShowCallDialog] = useState(false);
  // const [isVideoCall, setIsVideoCall] = useState(false);
  const { initiateCall } = useCall();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, you'd upload the file and get a URL
      const fileUrl = URL.createObjectURL(file);
      onSendMessage(`Sent a file: ${file.name}`, 'file', fileUrl, file.name);
    }
  };

  if (!selectedContact) {
    return (
      <div className="flex-1 flex items-center justify-center bg-chat-bg">
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-chat-bg">
      {/* Chat Header */}
      <div className="p-4 border-b border-border bg-background/95 backdrop-blur-sm relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isMobile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBackToContacts}
                className="p-2 hover:bg-primary-light hover:text-primary mr-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <div className="relative">
              <Avatar className={`${isMobile ? 'h-12 w-12' : 'h-10 w-10'}`}>
                <AvatarImage 
                  src={selectedContact.avatar || (selectedContact.gender === 'male' ? boyAvatar : girlAvatar)} 
                  alt={selectedContact.isBlocked ? 'Blocked User' : selectedContact.name} 
                />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {selectedContact.isBlocked ? 'B' : selectedContact.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              {selectedContact.isOnline && (
                <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-online-status rounded-full border-2 border-background" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`font-semibold ${isMobile ? 'text-base' : 'text-sm'}`}>
                  {selectedContact.isBlocked ? 'Blocked User' : selectedContact.name}
                </h3>
                {selectedContact.isBlocked && (
                  <Badge variant="destructive" className="text-xs">
                    Blocked
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {selectedContact.isBlocked ? 'Messages blocked' : (selectedContact.isOnline ? 'Online' : 'Last seen recently')}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="hover:bg-primary-light hover:text-primary p-2"
              disabled={selectedContact.isBlocked}
              onClick={() => {
                if (selectedContact?.id) {
                  initiateCall(selectedContact.id, false);
                }
              }}
            >
              <Phone className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="hover:bg-primary-light hover:text-primary p-2"
              disabled={selectedContact.isBlocked}
              onClick={() => {
                if (selectedContact?.id) {
                  initiateCall(selectedContact.id, true);
                }
              }}
            >
              <Video className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="hover:bg-primary-light hover:text-primary p-2">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => setShowBlockDialog(true)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Ban className="h-4 w-4 mr-2" />
                  {selectedContact.isBlocked ? 'Unblock User' : 'Block User'}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-red-600 focus:text-red-600"
                >
                  {/* Using inline SVG to avoid new imports if Trash icon not imported */}
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"></path></svg>
                  Delete Chat
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <AlertDialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <div className={isMobile ? "px-4 w-full flex justify-center items-center" : ""}>
          <AlertDialogContent className="w-[calc(100%-2rem)] md:w-auto md:max-w-lg rounded-2xl overflow-hidden">
            <AlertDialogHeader>
              <AlertDialogTitle>
                {selectedContact.isBlocked ? "Unblock User" : "Block User"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {selectedContact.isBlocked 
                  ? `Are you sure you want to unblock ${selectedContact.originalName || selectedContact.name}?`
                  : `Are you sure you want to block ${selectedContact.name}? You won't receive their messages anymore.`
                }
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  onBlockUser(selectedContact.id);
                  setShowBlockDialog(false);
                }}
                className={`rounded-xl ${selectedContact.isBlocked ? "bg-primary" : "bg-destructive hover:bg-destructive/90"}`}
              >
                {selectedContact.isBlocked ? "Unblock" : "Block"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </div>
      </AlertDialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <div className={isMobile ? "px-4 w-full flex justify-center items-center" : ""}>
          <AlertDialogContent className="w-[calc(100%-2rem)] md:w-auto md:max-w-lg rounded-2xl overflow-hidden">
            <AlertDialogHeader>
              <AlertDialogTitle>
                Delete Chat
              </AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently remove this conversation from your device. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  onDeleteChat(selectedContact.id);
                  setShowDeleteDialog(false);
                }}
                className="rounded-xl bg-destructive hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </div>
      </AlertDialog>

      {/* Messages */}
      <div className={`flex-1 overflow-y-auto space-y-4 mobile-scroll ${isMobile ? 'p-3' : 'p-4'}`}>
        {messages.map((message) => (
          <MessageBubble 
            key={message.id} 
            message={message} 
            isMobile={isMobile}
            isFromBlockedUser={selectedContact?.isBlocked && (!!user ? message.senderId !== user.nametag : message.senderId !== "current")}
            remoteAvatar={selectedContact?.avatar}
            remoteGender={selectedContact?.gender}
          />
        ))}
      </div>

      {/* Message Input */}
      <div className={`border-t border-border bg-background/95 backdrop-blur-sm safe-area-bottom ${isMobile ? 'p-3' : 'p-4'}`}>
        {selectedContact.isBlocked ? (
          <div className="text-center text-sm text-muted-foreground">
            You can't send messages to blocked users
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="shrink-0 hover:bg-primary-light hover:text-primary p-2">
                  <Plus className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                  <Paperclip className="h-4 w-4 mr-2" />
                  Attach File
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Send Image
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                  <FileText className="h-4 w-4 mr-2" />
                  Send Document
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Mic className="h-4 w-4 mr-2" />
                  Voice Message
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex-1 relative">
              <Input
                placeholder="Type a message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className={`pr-12 bg-muted/50 border-muted focus:bg-background ${isMobile ? 'text-base' : ''}`}
              />
            </div>

            <Button 
              onClick={handleSend}
              className="shrink-0 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white p-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all duration-200 border border-red-400/20 hover:border-red-300/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-md"
              disabled={!message.trim()}
            >
              <Send className="h-4 w-4 drop-shadow-sm" />
            </Button>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileSelect}
        accept="*/*"
      />

      {/** Outgoing call UI handled by call state; Incoming overlay handled in ChatApp */}
    </div>
  );
};