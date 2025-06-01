import React, { createContext, useContext, useEffect, useState } from "react";
import { AuthUser } from "../types/auth";
import firebaseAuthService from "../services/firebaseAuthService";
import { appleAuthService } from "../services/appleAuthService";
import { googleAuthService } from "../services/googleAuthService";

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    displayName?: string
  ) => Promise<{ error?: any }>;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error?: any; user?: AuthUser }>;
  signInWithApple: () => Promise<{
    error?: any;
    user?: AuthUser;
  }>;
  signInWithGoogle: () => Promise<{
    error?: any;
    user?: AuthUser;
  }>;
  signOut: () => Promise<{ error?: any }>;
  resetPassword: (email: string) => Promise<{ error?: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Configure Google Sign In when the app starts
  useEffect(() => {
    googleAuthService.configure();
  }, []);

  useEffect(() => {
    // Listen for auth changes
    const unsubscribe = firebaseAuthService.onAuthStateChanged(
      (firebaseUser) => {
        console.log("Auth state changed:", firebaseUser?.email);
        setUser(firebaseUser);
        setLoading(false);
      }
    );

    // Listen for Apple credential revocation
    const unsubscribeApple = appleAuthService.onCredentialRevoked(async () => {
      // Sign out if Apple credentials are revoked
      await signOut();
    });

    return () => {
      unsubscribe();
      unsubscribeApple();
    };
  }, []);

  const signUp = async (
    email: string,
    password: string,
    displayName?: string
  ) => {
    try {
      await firebaseAuthService.signUp(email, password, displayName);
      return { error: null };
    } catch (error) {
      console.error("Sign up error:", error);
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const user = await firebaseAuthService.signIn(email, password);
      return { error: null, user };
    } catch (error) {
      console.error("Sign in error:", error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      // Also sign out from Google if signed in
      await googleAuthService.signOut();
      await firebaseAuthService.signOut();
      return { error: null };
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("auth/no-current-user")
      ) {
        return { error: null };
      }

      console.error("Sign out error:", error);
      return { error };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await firebaseAuthService.resetPassword(email);
      return { error: null };
    } catch (error) {
      console.error("Reset password error:", error);
      return { error };
    }
  };

  const signInWithApple = async () => {
    try {
      const result = await appleAuthService.signIn();
      if (result.error) {
        return { error: result.error };
      }
      return { error: null, user: result.user };
    } catch (error) {
      console.error("Apple sign in error:", error);
      return { error };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const result = await googleAuthService.signIn();
      if (result.error) {
        return { error: result.error };
      }
      return { error: null, user: result.user };
    } catch (error) {
      console.error("Google sign in error:", error);
      return { error };
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signUp,
    signIn,
    signInWithApple,
    signInWithGoogle,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
