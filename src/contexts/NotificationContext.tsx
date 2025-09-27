import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface FriendRequest {
  id: string;
  fromUser: {
    nametag: string;
    avatar: string;
  };
  type: 'friend_request' | 'friend_accepted';
  timestamp: string;
  isRead: boolean;
}

interface NotificationContextType {
  notifications: FriendRequest[];
  unreadCount: number;
  addNotification: (notification: Omit<FriendRequest, 'id' | 'timestamp' | 'isRead'>) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  removeNotification: (notificationId: string) => void;
  sendFriendRequest: (toUser: string) => void;
  acceptFriendRequest: (requestId: string, fromUser: string) => void;
  declineFriendRequest: (requestId: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  const [notifications, setNotifications] = useState<FriendRequest[]>([]);

  useEffect(() => {
    // Load notifications from localStorage
    const savedNotifications = localStorage.getItem('andes_notifications');
    if (savedNotifications) {
      try {
        setNotifications(JSON.parse(savedNotifications));
      } catch (error) {
        console.error('Error parsing saved notifications:', error);
        localStorage.removeItem('andes_notifications');
      }
    }
  }, []);

  useEffect(() => {
    // Save notifications to localStorage whenever they change
    localStorage.setItem('andes_notifications', JSON.stringify(notifications));
  }, [notifications]);

  const addNotification = (notification: Omit<FriendRequest, 'id' | 'timestamp' | 'isRead'>) => {
    const newNotification: FriendRequest = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: false
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  };

  const removeNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== notificationId));
  };

  const sendFriendRequest = (toUser: string) => {
    // In a real app, this would send a request to the server
    // For now, we'll simulate it by adding a notification to the target user
    console.log(`Friend request sent to ${toUser}`);
    
    // Simulate the other user receiving the request
    setTimeout(() => {
      addNotification({
        fromUser: {
          nametag: toUser,
          avatar: "/placeholder.svg"
        },
        type: 'friend_request'
      });
    }, 1000);
  };

  const acceptFriendRequest = (requestId: string, fromUser: string) => {
    // Remove the friend request notification
    removeNotification(requestId);
    
    // Add a friend accepted notification
    addNotification({
      fromUser: {
        nametag: fromUser,
        avatar: "/placeholder.svg"
      },
      type: 'friend_accepted'
    });
  };

  const declineFriendRequest = (requestId: string) => {
    removeNotification(requestId);
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
