import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, Check, X, UserPlus, Users } from "lucide-react";
import { useNotifications, FriendRequest } from "@/contexts/NotificationContext";

export const NotificationPanel = () => {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    removeNotification,
    acceptFriendRequest,
    declineFriendRequest
  } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const handleAcceptRequest = (notification: FriendRequest) => {
    acceptFriendRequest(notification.id, notification.fromUser.nametag);
  };

  const handleDeclineRequest = (notification: FriendRequest) => {
    declineFriendRequest(notification.id);
  };

  const getNotificationIcon = (type: FriendRequest['type']) => {
    switch (type) {
      case 'friend_request':
        return <UserPlus className="h-4 w-4 text-blue-500" />;
      case 'friend_accepted':
        return <Users className="h-4 w-4 text-green-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationMessage = (notification: FriendRequest) => {
    switch (notification.type) {
      case 'friend_request':
        return `${notification.fromUser.nametag} sent you a friend request`;
      case 'friend_accepted':
        return `${notification.fromUser.nametag} accepted your friend request`;
      default:
        return 'New notification';
    }
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative hover:bg-red-100 hover:text-red-600 transition-all duration-200"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-red-500 text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <div className="fixed left-1/2 transform -translate-x-1/2 top-[84px] bottom-0 z-50 bg-white">
          <Card className="shadow-2xl border-0 bg-white w-[400px] h-full" style={{ backgroundColor: 'white' }}>
            <CardHeader className="pb-3 bg-white">
              <div className="flex flex-col items-center justify-center text-center bg-white">
                <CardTitle className="text-lg font-semibold mb-2">Notifications</CardTitle>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Mark all read
                  </Button>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="p-0 bg-white">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-gray-500 bg-white">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                <ScrollArea className="h-[calc(100vh-160px)]">
                  <div className="space-y-1">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 border-b border-gray-100 bg-white hover:bg-gray-50 transition-colors ${
                          !notification.isRead ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex flex-col items-center text-center gap-3 px-4">
                          <div className="flex-shrink-0">
                            {getNotificationIcon(notification.type)}
                          </div>
                          
                          <div className="flex-1 min-w-0 flex flex-col items-center">
                            <div className="flex flex-col items-center gap-2 mb-1">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={notification.fromUser.avatar} />
                                <AvatarFallback className="text-sm">
                                  {notification.fromUser.nametag.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <p className="text-sm font-medium text-gray-900 text-center">
                                {getNotificationMessage(notification)}
                              </p>
                            </div>
                            
                            <p className="text-xs text-gray-500 mb-3">
                              {notification.timestamp}
                            </p>
                            
                            {notification.type === 'friend_request' && (
                              <div className="flex gap-3 justify-center w-full">
                                <Button
                                  size="sm"
                                  onClick={() => handleAcceptRequest(notification)}
                                  className="h-8 px-4 text-sm bg-green-500 hover:bg-green-600 text-white"
                                >
                                  <Check className="h-4 w-4 mr-2" />
                                  Accept
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeclineRequest(notification)}
                                  className="h-8 px-4 text-sm border-red-200 text-red-600 hover:bg-red-50"
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Decline
                                </Button>
                              </div>
                            )}
                          </div>
                          
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Overlay to close panel when clicking outside */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}; 