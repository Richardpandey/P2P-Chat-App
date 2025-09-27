import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import boyAvatar from "@/assets/boy.png";
import girlAvatar from "@/assets/girl.png";
import { Search, UserPlus } from "lucide-react";
import { Contact } from "./ChatApp";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { UserProfile } from "./UserProfile";

interface ChatSidebarProps {
  contacts: Contact[];
  selectedContact: Contact | null;
  onSelectContact: (contact: Contact) => void;
  isOpen: boolean;
  isMobile: boolean;
  onClose: () => void;
}

export const ChatSidebar = ({ 
  contacts, 
  selectedContact, 
  onSelectContact, 
  isOpen, 
  isMobile, 
  onClose 
}: ChatSidebarProps) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [showFindFriendsDialog, setShowFindFriendsDialog] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);

  const filteredContacts = contacts.filter(contact => {
    const searchText = contact.isBlocked ? 'Blocked User' : contact.name;
    return searchText.toLowerCase().includes(searchQuery.toLowerCase()) ||
           (!contact.isBlocked && contact.username.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  return (
    <div className={`
      bg-sidebar-bg border-r border-border flex flex-col transition-transform duration-300 ease-in-out
      ${isMobile ? 'fixed left-0 top-24 bottom-0 z-30 w-full max-w-sm' : 'w-80 relative'}
      ${isMobile && !isOpen ? '-translate-x-full' : 'translate-x-0'}
    `}>
      {/* User Profile Section */}
      <div className="p-4 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            className="flex-1 flex items-center justify-start gap-3 h-auto p-2 hover:bg-muted/50 w-full"
            onClick={() => setShowUserProfile(true)}
          >
            <Avatar className="h-10 w-10 ring-2 ring-primary/10">
              <AvatarImage 
                src={user?.avatar || (user?.gender === 'male' ? boyAvatar : girlAvatar)} 
                alt={user?.nametag} 
              />
              <AvatarFallback className="bg-primary/10 text-primary">
                {user?.nametag.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start">
              <span className="font-semibold text-sm">{user?.nametag}</span>
              <span className="text-xs text-muted-foreground">View Profile</span>
            </div>
          </Button>
        </div>
      </div>

      {/* Mobile Header */}
      {isMobile && (
        <div className="flex items-center p-4 border-b border-border bg-background/95 backdrop-blur-sm">
          <h2 className="font-semibold text-lg">Chats</h2>
        </div>
      )}
      
      <UserProfile 
        open={showUserProfile}
        onClose={() => setShowUserProfile(false)}
      />

      {/* Search and Find Friends */}
      <div className="p-4 border-b border-border/40">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-muted/50 border-muted focus:bg-background"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              const ev = new CustomEvent('andes:openSearch');
              window.dispatchEvent(ev);
            }}
            className="shrink-0"
          >
            <UserPlus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Find Friends dialog now handled by top-level SearchDialog */}

      {/* Contacts List */}
      <div className="flex-1 overflow-y-auto mobile-scroll">
        {filteredContacts.map((contact) => (
          <div
            key={contact.id}
            onClick={() => onSelectContact(contact)}
            className={`p-4 cursor-pointer transition-all duration-200 hover:bg-muted/50 border-b border-border/50 active:bg-muted ${
              selectedContact?.id === contact.id ? 'bg-primary-light border-l-4 border-l-primary' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className={`${isMobile ? 'h-14 w-14' : 'h-12 w-12'}`}>
                  <AvatarImage 
                    src={contact.avatar || (contact.gender === 'male' ? boyAvatar : girlAvatar)} 
                    alt={contact.isBlocked ? 'Blocked User' : contact.name} 
                  />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {contact.isBlocked ? 'B' : contact.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                {contact.isOnline && (
                  <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-online-status rounded-full border-2 border-background online-pulse" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <h3 className={`font-semibold truncate ${isMobile ? 'text-base' : 'text-sm'}`}>
                      {contact.isBlocked ? 'Blocked User' : contact.name}
                    </h3>
                    {contact.isBlocked && (
                      <Badge variant="destructive" className="text-xs">
                        Blocked
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{contact.lastMessageTime}</span>
                </div>
                {contact.isBlocked ? (
                  <p className="text-xs text-destructive/70 mt-1">Messages blocked</p>
                ) : (
                  <>
                    <div className="flex items-center justify-end">
                      {contact.unreadCount > 0 && (
                        <Badge className="bg-primary text-primary-foreground text-xs min-w-[20px] h-5 rounded-full flex items-center justify-center">
                          {contact.unreadCount}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground/70 mt-1">{contact.username}</p>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};