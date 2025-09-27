import { useState, useEffect, useMemo } from "react";
import { ChatSidebar } from "./ChatSidebar";
import { ChatArea } from "./ChatArea";
import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";
import appLogo from "@/assets/logo.png";
import chatBgPattern from "@/assets/chat-bg-pattern.jpg";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { useCall } from "@/contexts/CallContext";
import { IncomingCallDialog } from "./IncomingCallDialog";
import { SearchDialog } from "./SearchDialog";
import { useCallTimer } from "@/hooks/use-call-timer";
import { CallScreen } from "./CallScreen";

export interface Contact {
  id: string;
  name: string;
  username: string;
  avatar: string;
  gender: 'male' | 'female';
  lastMessage: string;
  lastMessageTime: string;
  isOnline: boolean;
  unreadCount: number;
  isBlocked?: boolean;
  originalName?: string; // Stores the original name when blocked
}

export interface Message {
  id: string;
  senderId: string;
  senderGender?: 'male' | 'female';
  content: string;
  timestamp: string;
  type: 'text' | 'file' | 'audio' | 'video';
  fileUrl?: string;
  fileName?: string;
  toId?: string;
}

const CONTACTS_KEY = 'andes_contacts';
const MESSAGES_KEY = 'andes_messages';

export const ChatApp = () => {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { sendChat, addChatListener, removeChatListener, addPresenceListener, removePresenceListener, callState, acceptCall, rejectCall, endCall } = useCall();
  const callTimer = useCallTimer(callState.callStartTime);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  // Only chats view is kept; no other menus
  const [contacts, setContacts] = useState<Contact[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(CONTACTS_KEY) || '[]');
    } catch {
      return [];
    }
  });
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(MESSAGES_KEY) || '[]');
    } catch {
      return [];
    }
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleSendMessage = (content: string, type: 'text' | 'file' = 'text', fileUrl?: string, fileName?: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: user?.nametag || "current",
      senderGender: user?.gender as 'male' | 'female',
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type,
      fileUrl,
      fileName,
      toId: selectedContact?.id,
    };
    setMessages(prev => [...prev, newMessage]);

    // Update contact list metadata
    if (selectedContact) {
      const timeStr = newMessage.timestamp;
      setContacts(prev => prev.map(c => c.id === selectedContact.id
        ? { ...c, lastMessage: content, lastMessageTime: timeStr }
        : c
      ));
    }

    // Try to send via signaling chat (or WebRTC if later moved)
    if (selectedContact?.id) {
      try { sendChat(selectedContact.id, content); } catch {}
    }
  };

  const handleAddContact = (contact: Contact) => {
    setContacts(prev => {
      const exists = prev.some(c => c.id === contact.id || c.username === contact.username);
      if (exists) return prev;
      const next = [...prev, contact];
      localStorage.setItem(CONTACTS_KEY, JSON.stringify(next));
      return next;
    });
  };

  const handleDeleteChat = (userId: string) => {
    // Remove messages involving this contact (both directions)
    setMessages(prev => {
      const me = user?.nametag || 'current';
      const filtered = prev.filter(m => {
        const to = m.toId || userId;
        const isFromMeToUser = m.senderId === me && to === userId;
        const isFromUser = m.senderId === userId;
        return !(isFromMeToUser || isFromUser);
      });
      localStorage.setItem(MESSAGES_KEY, JSON.stringify(filtered));
      return filtered;
    });

    // Remove the contact entirely from the sidebar/list
    setContacts(prev => {
      const next = prev.filter(c => c.id !== userId);
      localStorage.setItem(CONTACTS_KEY, JSON.stringify(next));
      return next;
    });

    // If currently viewing this chat, clear selection so UI falls back gracefully
    if (selectedContact?.id === userId) {
      setSelectedContact(null);
    }
  };

  const handleSelectContact = (contact: Contact) => {
    setSelectedContact(contact);
    // Reset unread for this contact
    setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, unreadCount: 0 } : c));
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  const handleBackToContacts = () => {
    if (isMobile) {
      setSelectedContact(null);
      setIsSidebarOpen(true);
    }
  };

  const handleBlockUser = (userId: string) => {
    // Toggle block status for the user
    let updatedContact: Contact | undefined;
    
    setContacts(prev => {
      const updated = prev.map(contact => {
        if (contact.id === userId) {
          const isCurrentlyBlocked = contact.isBlocked;
          updatedContact = {
            ...contact,
            isBlocked: !isCurrentlyBlocked,
            name: isCurrentlyBlocked ? contact.originalName || contact.name : contact.name,
            originalName: !isCurrentlyBlocked ? contact.name : contact.originalName
          };
          return updatedContact;
        }
        return contact;
      });
      
      // Update selectedContact if it's the blocked/unblocked user
      if (updatedContact && selectedContact?.id === userId) {
        setSelectedContact(updatedContact);
      }
      
      return updated;
    });

    // Store blocked users in localStorage
    const blockedUsers = JSON.parse(localStorage.getItem('andes_blocked_users') || '[]');
    const isCurrentlyBlocked = blockedUsers.includes(userId);
    
    if (isCurrentlyBlocked) {
      // Unblock: remove from blocked list
      localStorage.setItem('andes_blocked_users', JSON.stringify(blockedUsers.filter(id => id !== userId)));
    } else {
      // Block: add to blocked list
      blockedUsers.push(userId);
      localStorage.setItem('andes_blocked_users', JSON.stringify(blockedUsers));
    }
  };

  // Handle mobile sidebar visibility when screen size changes
  // Initialize blocked users from localStorage
  useEffect(() => {
    const openSearch = () => setIsSearchOpen(true);
    window.addEventListener('andes:openSearch', openSearch as EventListener);
    return () => window.removeEventListener('andes:openSearch', openSearch as EventListener);
  }, []);

  useEffect(() => {
    const blockedUsers = JSON.parse(localStorage.getItem('andes_blocked_users') || '[]');
    setContacts(prev => prev.map(contact => ({
      ...contact,
      isBlocked: blockedUsers.includes(contact.id),
      originalName: blockedUsers.includes(contact.id) ? contact.name : undefined
    })));
  }, []);

  // Persist messages on change
  useEffect(() => {
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
  }, [messages]);

  // Listen for inbound chat messages from signaling
  useEffect(() => {
    const onChat = ({ sender, content, timestamp }: { sender: string; content: string; timestamp: number }) => {
      const msg: Message = {
        id: String(timestamp),
        senderId: sender,
        content,
        timestamp: new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'text',
      };
      setMessages(prev => [...prev, msg]);

      // Update or insert contact for sender
      const timeStr = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setContacts(prev => {
        const exists = prev.find(c => c.id === sender);
        if (exists) {
          return prev.map(c =>
            c.id === sender
              ? { ...c, lastMessage: content, lastMessageTime: timeStr, unreadCount: (selectedContact?.id === sender ? c.unreadCount : (c.unreadCount || 0) + 1) }
              : c
          );
        }
        // If the contact doesn't exist yet, add a minimal entry
        const newContact = {
          id: sender,
          name: sender,
          username: `@${sender}`,
          avatar: "/placeholder.svg",
          gender: 'male' as const,
          lastMessage: content,
          lastMessageTime: timeStr,
          isOnline: true,
          unreadCount: selectedContact?.id === sender ? 0 : 1,
        };
        return [...prev, newContact];
      });

      // Enrich contact profile (avatar/gender/online) from server
      (async () => {
        try {
          const host = window.location.hostname;
          const res = await fetch(`http://${host}:8081/users/${encodeURIComponent(sender)}`);
          if (!res.ok) return;
          const u = await res.json();
          setContacts(prev => prev.map(c => c.id === sender ? {
            ...c,
            avatar: u.avatar || c.avatar,
            gender: (u.gender === 'male' || u.gender === 'female') ? u.gender : c.gender,
            username: `@${u.nametag || sender}`,
            isOnline: typeof u.online === 'boolean' ? u.online : c.isOnline,
          } : c));
        } catch {}
      })();
    };
    addChatListener(onChat);
    return () => removeChatListener(onChat);
  }, [addChatListener, removeChatListener]);

  // Live presence updates (online dot & last seen)
  useEffect(() => {
    const onPresence = ({ userId, online }: { userId: string; online: boolean }) => {
      setContacts(prev => prev.map(c => c.id === userId ? { ...c, isOnline: online } : c));
    };
    addPresenceListener(onPresence);
    return () => removePresenceListener(onPresence);
  }, [addPresenceListener, removePresenceListener]);

  // Periodic contact avatar refresh for known contacts (in case avatars changed)
  useEffect(() => {
    const controller = new AbortController();
    const refresh = async () => {
      try {
        const host = window.location.hostname;
        const updates = await Promise.all(contacts.map(async (c) => {
          try {
            const res = await fetch(`http://${host}:8081/users/${encodeURIComponent(c.id)}`, { signal: controller.signal });
            if (!res.ok) return c;
            const u = await res.json();
            return {
              ...c,
              avatar: u.avatar || c.avatar,
              gender: (u.gender === 'male' || u.gender === 'female') ? u.gender : c.gender,
              username: `@${u.nametag || c.id}`,
              isOnline: typeof u.online === 'boolean' ? u.online : c.isOnline,
            };
          } catch { return c; }
        }));
        setContacts(updates);
      } catch {}
    };
    // Initial refresh and then every 20s
    refresh();
    const t = setInterval(refresh, 20000);
    return () => { clearInterval(t); controller.abort(); };
  }, [contacts.length]);

  // Derived: messages for selected contact only
  const visibleMessages = useMemo(() => {
    if (!selectedContact) return [] as Message[];
    const me = user?.nametag || 'current';
    return messages.filter(m => {
      const to = m.toId || selectedContact.id;
      return (
        (m.senderId === me && to === selectedContact.id) ||
        (m.senderId === selectedContact.id)
      );
    });
  }, [messages, selectedContact, user?.nametag]);

  useEffect(() => {
    if (!isMobile) {
      // Desktop: keep sidebar open, do NOT auto-select a chat
      setIsSidebarOpen(true);
    } else {
      // Mobile: sidebar open when no chat selected; otherwise show chat
      setIsSidebarOpen(!selectedContact);
    }
  }, [isMobile, selectedContact]);

  // Search/menu removed

  // Persist contacts whenever they change
  useEffect(() => {
    localStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));
  }, [contacts]);

  return (
    <div className="h-screen flex bg-background relative overflow-hidden">
      {/* Full-Screen Call UI - Shows when call is connected */}
      {callState.isInCall && callState.connectionState === 'connected' && callState.remoteUser && (
        <CallScreen
          remoteUser={{
            id: callState.remoteUser,
            name: contacts.find(c => c.id === callState.remoteUser)?.name || callState.remoteUser,
            avatar: contacts.find(c => c.id === callState.remoteUser)?.avatar,
            gender: contacts.find(c => c.id === callState.remoteUser)?.gender,
          }}
          onEndCall={endCall}
        />
      )}

      {/* In-call banner removed */}

      {/* Outgoing Calling Banner */}
      {callState.isCaller && callState.isInCall && !callState.remoteStream && callState.remoteUser && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-card/95 backdrop-blur border border-border shadow-medium rounded-full px-4 py-2 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-full animate-pulse">
              <Phone className="h-4 w-4 text-primary rotate-[315deg]" />
            </div>
            <span className="text-sm">
              Calling {contacts.find(c => c.id === callState.remoteUser)?.name || `@${callState.remoteUser}`}...
            </span>
          </div>
          <Button size="sm" variant="destructive" className="rounded-full h-7 px-3" onClick={endCall}>
            End
          </Button>
        </div>
      )}
      {callState.isIncoming && callState.remoteUser && (
        <IncomingCallDialog
          isOpen={true}
          callerName={contacts.find(c => c.id === callState.remoteUser)?.name || callState.remoteUser}
          callerAvatar={contacts.find(c => c.id === callState.remoteUser)?.avatar}
          callerGender={contacts.find(c => c.id === callState.remoteUser)?.gender || 'male'}
          isVideo={callState.isVideoEnabled}
          onAccept={acceptCall}
          onDecline={rejectCall}
        />
      )}
      {/* Background Pattern - chats only (others removed) */}
      {(
        <div 
          className="absolute inset-0 opacity-5 mix-blend-multiply"
          style={{
            backgroundImage: `url(${chatBgPattern})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      )}

      {/* Search / Add Friends Dialog */}
      <SearchDialog
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onAddContact={(c) => {
          handleAddContact(c);
          // Optionally auto-select newly added contact
          // setSelectedContact(c);
        }}
      />
      
      {/* Global Header - Always visible on desktop, hidden on mobile when chat is selected */}
      {!(isMobile && selectedContact) && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/40 shadow-soft safe-area-top">
          <div className="flex items-center justify-between p-4">
            {/* Left side menus removed */}
            <div className="flex items-center gap-2 flex-shrink-0" />

            {/* Centered logo - bigger on mobile */}
            <div className="flex items-center mx-4">
              <img
                src={appLogo}
                alt="App Logo"
                className={`${isMobile ? 'h-10' : 'h-8'} w-auto select-none pointer-events-none drop-shadow-sm`}
                draggable={false}
              />
            </div>

            {/* Right side menus removed */}
            <div className="flex items-center gap-2" />
          </div>
        </div>
      )}

      {/* Main Content Area: Chats only */}
      {
        <div className={`flex w-full relative z-[1] overflow-hidden bg-background ${!isMobile ? 'pt-24' : (selectedContact ? '' : 'pt-24')}`}>
          {/* Mobile Overlay */}
          {isMobile && isSidebarOpen && selectedContact && (
            <div 
              className="absolute inset-0 bg-black/50 z-20"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}
          <ChatSidebar
            contacts={contacts}
            selectedContact={selectedContact}
            onSelectContact={handleSelectContact}
            isOpen={isSidebarOpen}
            isMobile={isMobile}
            onClose={() => setIsSidebarOpen(false)}
          />
          <ChatArea
            selectedContact={selectedContact}
            messages={visibleMessages}
            onSendMessage={handleSendMessage}
            onBlockUser={handleBlockUser}
            onDeleteChat={handleDeleteChat}
            isMobile={isMobile}
            onBackToContacts={handleBackToContacts}
          />
        </div>
      }
    </div>
  );
};