import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogOverlay,
  DialogPortal,
} from "@/components/ui/dialog";
import boyAvatar from "@/assets/boy.png";
import girlAvatar from "@/assets/girl.png";
import { useTheme } from "./ThemeProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  User, 
  Calendar, 
  Moon,
  LogOut,
  X
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface UserProfileProps {
  open: boolean;
  onClose: () => void;
}

export const UserProfile = ({ open, onClose }: UserProfileProps) => {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [isEditing, setIsEditing] = useState(false);

  if (!user) return null;

  const handleSignOut = () => {
    signOut();
    onClose();
  };

  const joinDate = new Date(user.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-[88vw] max-w-sm p-0 overflow-visible gap-0 rounded-3xl bg-transparent border-0 shadow-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
        {/* 3D neutral (B/W) gradient border wrapper */}
        <div className="rounded-3xl p-[1px] bg-gradient-to-br from-white/20 via-white/10 to-transparent dark:from-white/10 dark:via-white/5 dark:to-transparent shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
          <div className="relative rounded-[calc(1.5rem-1px)] bg-card/95 backdrop-blur-md border border-white/10 overflow-hidden">
            <DialogClose asChild>
              <Button
                variant="destructive"
                className="absolute right-3 top-3 rounded-xl hover:bg-destructive/90 transition-colors z-50 h-8 w-8 p-0"
                title="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>

            <ScrollArea className="flex-1 p-5 max-h-[80vh]">
          {/* Profile Header */}
          <div className="flex flex-col items-center text-center space-y-4 mb-8">
            <div className="relative group">
              <Avatar className="h-24 w-24 ring-4 ring-white/10 transition-transform group-hover:scale-105">
                <AvatarImage 
                  src={user.avatar || (user.gender === 'male' ? boyAvatar : girlAvatar)} 
                  alt={user.nametag} 
                />
                <AvatarFallback className="bg-primary/10 text-primary text-3xl">
                  {user.nametag.charAt(0)}
                </AvatarFallback>
              </Avatar>
              
              {/* Change Photo Button */}
              <label 
                htmlFor="profile-photo" 
                className="absolute inset-0 flex items-center justify-center rounded-full cursor-pointer
                        bg-black/0 hover:bg-black/40 transition-colors"
              >
                <span className="text-white/0 group-hover:text-white/90 transition-colors text-sm font-medium">
                  Change Photo
                </span>
              </label>
              <input
                type="file"
                id="profile-photo"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                      const newAvatar = e.target?.result as string;
                      // Update local storage with new avatar
                      const savedUser = localStorage.getItem('andes_user');
                      if (savedUser) {
                        const userData = JSON.parse(savedUser);
                        userData.avatar = newAvatar || (userData.gender === 'male' ? boyAvatar : girlAvatar);
                        localStorage.setItem('andes_user', JSON.stringify(userData));
                        
                        // Update users storage
                        const existingUsers = JSON.parse(localStorage.getItem('andes_users') || '{}');
                        if (existingUsers[userData.nametag]) {
                          existingUsers[userData.nametag].avatar = newAvatar || (userData.gender === 'male' ? boyAvatar : girlAvatar);
                          localStorage.setItem('andes_users', JSON.stringify(existingUsers));
                        }
                        
                        // Force a reload to update the UI
                        window.location.reload();
                      }
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{user.nametag}</h2>
              <Badge variant="outline" className="mt-2">
                {user.gender.charAt(0).toUpperCase() + user.gender.slice(1)}
              </Badge>
            </div>
          </div>

          {/* Profile Info */}
          <div className="space-y-4">
            <Card className="p-4 rounded-xl">
              <h3 className="font-semibold mb-3 text-sm text-muted-foreground">Account Information</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-primary" />
                  <span className="text-sm">{user.nametag}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="text-sm">Joined {joinDate}</span>
                </div>
              </div>
            </Card>

            <Card className="p-4 rounded-xl">
              <h3 className="font-semibold mb-3 text-sm text-muted-foreground">Preferences</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Moon className="h-4 w-4 text-primary" />
                    <span className="text-sm">Theme</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7"
                    onClick={() => {
                      setTheme(theme === "light" ? "dark" : "light");
                    }}
                  >
                    {theme === 'dark' ? 'Dark' : 'Light'}
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Sign Out */}
          <div className="mt-8">
            <Button
              variant="destructive"
              className="w-full rounded-xl hover:bg-destructive/90 transition-colors"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};