import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface MobileUser {
  id: string;
  phone: string;
  fullName?: string;
}

interface AuthContextType {
  user: User | null;
  mobileUser: MobileUser | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  isAuthenticated: boolean;
  signUp: (email: string, password: string, fullName?: string, phone?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithPhone: (phone: string) => Promise<{ error: Error | null }>;
  signInWithMobile: (phone: string, name?: string) => Promise<{ error: Error | null }>;
  verifyOtp: (phone: string, token: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to format Pakistani phone numbers
const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('92')) {
    return `+${cleaned}`;
  }
  if (cleaned.startsWith('0')) {
    return `+92${cleaned.slice(1)}`;
  }
  return `+92${cleaned}`;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [mobileUser, setMobileUser] = useState<MobileUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Load mobile user from localStorage on mount
  useEffect(() => {
    const savedMobileUser = localStorage.getItem('mobileUser');
    if (savedMobileUser) {
      try {
        setMobileUser(JSON.parse(savedMobileUser));
      } catch {
        localStorage.removeItem('mobileUser');
      }
    }
  }, []);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);

        // Defer role check with setTimeout to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            checkAdminRole(session.user.id);
          }, 0);
        } else {
          setIsAdmin(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
      
      if (session?.user) {
        checkAdminRole(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .rpc('has_role', { _user_id: userId, _role: 'admin' });
      
      if (!error) {
        setIsAdmin(data === true);
      }
    } catch (err) {
      console.error('Error checking admin role:', err);
    }
  };

  const signUp = async (email: string, password: string, fullName?: string, phone?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          phone: phone
        }
      }
    });

    if (!error && data.user) {
      // Create profile
      await supabase.from('profiles').insert({
        user_id: data.user.id,
        full_name: fullName,
        phone: phone
      });
    }

    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signInWithPhone = async (phone: string) => {
    const formattedPhone = formatPhoneNumber(phone);
    
    const { error } = await supabase.auth.signInWithOtp({
      phone: formattedPhone,
    });
    return { error: error as Error | null };
  };

  // Simple mobile login without OTP - creates a local session
  const signInWithMobile = async (phone: string, name?: string) => {
    try {
      const formattedPhone = formatPhoneNumber(phone);
      
      // Create a mobile user session (stored locally)
      const mobileUserData: MobileUser = {
        id: `mobile-${formattedPhone.replace(/\D/g, '')}`,
        phone: formattedPhone,
        fullName: name?.trim() || undefined,
      };
      
      setMobileUser(mobileUserData);
      localStorage.setItem('mobileUser', JSON.stringify(mobileUserData));
      
      // Try to create/update profile in database (will work if user exists in auth)
      // This is a best-effort operation for tracking purposes
      try {
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('phone', formattedPhone)
          .maybeSingle();

        if (!existingProfile && name) {
          // Profile doesn't exist, but we can't create without auth user
          // The profile will be created when they do full registration
          console.log('Profile will be created on full registration');
        }
      } catch {
        // Ignore profile errors - this is a simplified login
      }
      
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const verifyOtp = async (phone: string, token: string) => {
    const formattedPhone = formatPhoneNumber(phone);
    
    const { data, error } = await supabase.auth.verifyOtp({
      phone: formattedPhone,
      token,
      type: 'sms',
    });

    // Create profile if new user
    if (!error && data.user) {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', data.user.id)
        .maybeSingle();

      if (!existingProfile) {
        await supabase.from('profiles').insert({
          user_id: data.user.id,
          phone: formattedPhone
        });
      }
    }

    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsAdmin(false);
    setMobileUser(null);
    localStorage.removeItem('mobileUser');
  };

  // User is authenticated if they have either a Supabase session or mobile login
  const isAuthenticated = !!(user || mobileUser);

  return (
    <AuthContext.Provider
      value={{
        user,
        mobileUser,
        session,
        isLoading,
        isAdmin,
        isAuthenticated,
        signUp,
        signIn,
        signInWithPhone,
        signInWithMobile,
        verifyOtp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
