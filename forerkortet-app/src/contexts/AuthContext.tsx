import React, { createContext, useContext, useEffect, useState } from "react";
import { FirebaseAuthTypes } from "@react-native-firebase/auth";
import firebaseAuthService from "../services/firebaseAuthService";

interface AuthContextType {
  user: FirebaseAuthTypes.User | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    displayName?: string
  ) => Promise<{ error?: any }>;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error?: any; user?: FirebaseAuthTypes.User }>;
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
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for auth changes
    const unsubscribe = firebaseAuthService.onAuthStateChanged(
      (firebaseUser) => {
        console.log("Auth state changed:", firebaseUser?.email);
        setUser(firebaseUser);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
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
      await firebaseAuthService.signOut();
      return { error: null };
    } catch (error) {
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

  const value: AuthContextType = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
