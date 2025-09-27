import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Hash } from "lucide-react";
import { Contact } from "./ChatApp";
import { useAuth } from "@/contexts/AuthContext";

interface SearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddContact: (contact: Contact) => void;
}

type SearchUser = { nametag: string; gender: string; avatar: string; online?: boolean };

export const SearchDialog = ({ isOpen, onClose, onAddContact }: SearchDialogProps) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const host = window.location.hostname;
      const res = await fetch(`http://${host}:8081/users?q=${encodeURIComponent(searchQuery)}`);
      if (!res.ok) throw new Error('Search failed');
      const data: SearchUser[] = await res.json();
      // Exclude current user from results
      const filtered = data.filter(u => u.nametag !== user?.nametag);
      setSearchResults(filtered);
    } catch (e) {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddContact = (u: SearchUser) => {
    const newContact: Contact = {
      id: u.nametag,
      name: u.nametag,
      username: `@${u.nametag}`,
      avatar: u.avatar || "/placeholder.svg",
      gender: (u.gender === 'male' || u.gender === 'female') ? u.gender : 'male',
      isOnline: !!u.online,
      lastMessage: "Say hello to start chatting!",
      lastMessageTime: "now",
      unreadCount: 0
    };
    onAddContact(newContact);
    // Refresh from server to ensure latest avatar/gender
    (async () => {
      try {
        const host = window.location.hostname;
        const res = await fetch(`http://${host}:8081/users/${encodeURIComponent(u.nametag)}`);
        if (res.ok) {
          const full = await res.json();
          const enriched: Contact = {
            ...newContact,
            avatar: full.avatar || newContact.avatar,
            gender: (full.gender === 'male' || full.gender === 'female') ? full.gender : newContact.gender,
            isOnline: !!full.online,
          };
          onAddContact(enriched);
        }
      } catch {}
    })();
    onClose();
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5 text-primary" />
            Find Friends
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by nametag (e.g., @andes)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10"
              />
            </div>
            <Button 
              onClick={handleSearch} 
              disabled={!searchQuery.trim() || isSearching}
              className="bg-gradient-primary hover:opacity-90"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </Button>
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              <h3 className="text-sm font-medium text-muted-foreground">Search Results</h3>
              {searchResults.map((u) => (
                <div
                  key={u.nametag}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={u.avatar} alt={u.nametag} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {u.nametag.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      {u.online && (
                        <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-online-status rounded-full border-2 border-background" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{u.nametag}</h4>
                      <p className="text-sm text-muted-foreground">@{u.nametag}</p>
                      <div className="mt-1">
                        {u.online ? (
                          <Badge variant="outline" className="text-xs border-online-status text-online-status">Online</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">Offline</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleAddContact(u)}
                      className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl"
                    >
                      Add
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {searchQuery && searchResults.length === 0 && !isSearching && (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No users found matching "{searchQuery}"</p>
              <p className="text-xs mt-1">Tip: Search by exact nametag (without @) and ensure the user has the app open at least once.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};