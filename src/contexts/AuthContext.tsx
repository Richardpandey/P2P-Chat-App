import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  nametag: string;
  gender: string;
  avatar: string;
  isNewUser?: boolean;
  createdAt: string;
  lastLogin: string;
  preferences?: {
    theme?: 'light' | 'dark';
    notifications?: boolean;
    language?: string;
  };
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (nametag: string) => void;
  signUp: (nametag: string, gender: string, avatar: string) => void;
  signOut: () => void;
  clearAllSavedUsers: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // One-time purge for specific username if present
    const purgeFlag = localStorage.getItem('andes_purge_20250921_richarddd_done');
    try {
      const allUsers = JSON.parse(localStorage.getItem('andes_users') || '{}');
      if (!purgeFlag && allUsers && typeof allUsers === 'object') {
        if (allUsers['richarddd']) {
          delete allUsers['richarddd'];
          localStorage.setItem('andes_users', JSON.stringify(allUsers));
        }
        const saved = localStorage.getItem('andes_user');
        if (saved) {
          const u = JSON.parse(saved);
          if (u?.nametag === 'richarddd') {
            localStorage.removeItem('andes_user');
          }
        }
        localStorage.setItem('andes_purge_20250921_richarddd_done', '1');
      }
    } catch (e) {
      // ignore
    }

    // Load current session
    const savedUser = localStorage.getItem('andes_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('andes_user');
      }
    }
    setIsLoading(false);
  }, []);

  // Ensure server knows about the current user on app load
  useEffect(() => {
    if (user?.nametag) {
      try {
        const host = window.location.hostname;
        fetch(`http://${host}:8081/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nametag: user.nametag, gender: user.gender, avatar: user.avatar })
        }).catch(() => {});
      } catch {}
    }
  }, [user?.nametag]);

  const signIn = (nametag: string) => {
    try {
      const existingUsers = JSON.parse(localStorage.getItem('andes_users') || '{}');
      if (!existingUsers[nametag]) {
        throw new Error('User not found');
      }
      const storedUser = existingUsers[nametag];
      const userData: User = {
        nametag,
        gender: storedUser.gender,
        avatar: storedUser.avatar,
        isNewUser: false,
        createdAt: storedUser.createdAt,
        lastLogin: new Date().toISOString(),
        preferences: storedUser.preferences || {
          theme: 'light',
          notifications: true,
          language: 'en'
        }
      };
      existingUsers[nametag] = {
        ...storedUser,
        lastLogin: userData.lastLogin
      };
      localStorage.setItem('andes_users', JSON.stringify(existingUsers));
      setUser(userData);
      localStorage.setItem('andes_user', JSON.stringify(userData));

      // Register/update on signaling server for discovery
      try {
        const host = window.location.hostname;
        fetch(`http://${host}:8081/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nametag, gender: userData.gender, avatar: userData.avatar })
        }).catch(() => {});
      } catch {}
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const signUp = (nametag: string, gender: string, avatar: string) => {
    try {
      const existingUsers = JSON.parse(localStorage.getItem('andes_users') || '{}');
      if (existingUsers[nametag]) {
        throw new Error('Username already taken');
      }
      const now = new Date().toISOString();
      const userData: User = {
        nametag,
        gender,
        avatar,
        isNewUser: true,
        createdAt: now,
        lastLogin: now,
        preferences: {
          theme: 'light',
          notifications: true,
          language: 'en'
        }
      };
      existingUsers[nametag] = {
        gender,
        avatar,
        createdAt: now,
        lastLogin: now,
        preferences: userData.preferences
      };
      localStorage.setItem('andes_users', JSON.stringify(existingUsers));
      setUser(userData);
      localStorage.setItem('andes_user', JSON.stringify(userData));

      // Create on signaling server for discovery
      try {
        const host = window.location.hostname;
        fetch(`http://${host}:8081/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nametag, gender, avatar })
        }).catch(() => {});
      } catch {}
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem('andes_user');
  };

  const clearAllSavedUsers = () => {
    try {
      localStorage.removeItem('andes_user');
      localStorage.removeItem('andes_users');
      // Also clear chat-related local storage keys
      localStorage.removeItem('andes_contacts');
      localStorage.removeItem('andes_messages');
      localStorage.removeItem('andes_blocked_users');
      // Best-effort reset on signaling server (dev only)
      try {
        const host = window.location.hostname;
        fetch(`http://${host}:8081/admin/reset-users`, { method: 'POST' }).catch(() => {});
      } catch {}
    } catch {}
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    signIn,
    signUp,
    signOut,
    clearAllSavedUsers
  };

  useEffect(() => {
    (window as any).debugAuth = {
      clearAllSavedUsers,
    };
  }, []);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
