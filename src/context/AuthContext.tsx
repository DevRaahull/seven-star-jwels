import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSupabaseClient, getSupabaseConfig } from '../lib/supabase';

interface UserProfile {
  id: string;
  email: string;
  role: 'owner';
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isCloudConnected: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  registerOwner: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AUTHORIZED_OWNER_EMAIL = 'ravidhika08@gmail.com';
export const AUTHORIZED_OWNER_PASSWORD = 'Jatin@1234';

const LOCAL_AUTH_KEY = 'SSJ_AUTH_USER';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCloudConnected, setIsCloudConnected] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      const config = getSupabaseConfig();
      setIsCloudConnected(config.isConfigured);

      const client = getSupabaseClient();
      if (client) {
        try {
          const { data: { session } } = await client.auth.getSession();
          if (session?.user && session.user.email?.toLowerCase() === AUTHORIZED_OWNER_EMAIL) {
            setUser({
              id: session.user.id,
              email: AUTHORIZED_OWNER_EMAIL,
              role: 'owner'
            });
            setIsLoading(false);
            return;
          }

          client.auth.onAuthStateChange((_event, session) => {
            if (session?.user && session.user.email?.toLowerCase() === AUTHORIZED_OWNER_EMAIL) {
              setUser({
                id: session.user.id,
                email: AUTHORIZED_OWNER_EMAIL,
                role: 'owner'
              });
            } else {
              // Only keep user if authenticated in local storage
              const local = localStorage.getItem(LOCAL_AUTH_KEY);
              if (!local) setUser(null);
            }
          });
        } catch (e) {
          console.error('Supabase auth error:', e);
        }
      }

      // Check local session
      const savedUser = localStorage.getItem(LOCAL_AUTH_KEY);
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          if (parsed && parsed.email?.toLowerCase() === AUTHORIZED_OWNER_EMAIL) {
            setUser(parsed);
          } else {
            setUser(null);
            localStorage.removeItem(LOCAL_AUTH_KEY);
          }
        } catch {
          setUser(null);
          localStorage.removeItem(LOCAL_AUTH_KEY);
        }
      } else {
        // No auto-bypass: user must authenticate with ravidhika08@gmail.com / Jatin@1234
        setUser(null);
      }

      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const inputEmail = email.trim().toLowerCase();

    // Strict authentication against authorized owner credentials
    if (inputEmail !== AUTHORIZED_OWNER_EMAIL || password !== AUTHORIZED_OWNER_PASSWORD) {
      return { success: false, error: 'Invalid owner email or password. Access denied.' };
    }

    const client = getSupabaseClient();
    if (client) {
      try {
        const { error } = await client.auth.signInWithPassword({
          email: AUTHORIZED_OWNER_EMAIL,
          password: AUTHORIZED_OWNER_PASSWORD
        });
        if (error) {
          // If not created on Supabase yet, create account
          await client.auth.signUp({
            email: AUTHORIZED_OWNER_EMAIL,
            password: AUTHORIZED_OWNER_PASSWORD
          });
        }
      } catch (err: any) {
        console.warn('Supabase cloud auth notice:', err);
      }
    }

    const ownerProfile: UserProfile = {
      id: 'owner-ravidhika',
      email: AUTHORIZED_OWNER_EMAIL,
      role: 'owner'
    };
    setUser(ownerProfile);
    localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(ownerProfile));
    return { success: true };
  };

  const registerOwner = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    return login(email, password);
  };

  const logout = async () => {
    const client = getSupabaseClient();
    if (client) {
      await client.auth.signOut();
    }
    localStorage.removeItem(LOCAL_AUTH_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isCloudConnected,
        login,
        logout,
        registerOwner
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
