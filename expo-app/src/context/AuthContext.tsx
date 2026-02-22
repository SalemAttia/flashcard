import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, onSnapshot, DocumentSnapshot } from "firebase/firestore";
import { auth, db } from "../firebase/config";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isAllowed: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    let allowedUnsub: () => void;

    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);

      if (u) {
        // Monitor the user's profile document
        const userRef = doc(db, "users", u.uid);

        allowedUnsub = onSnapshot(userRef, (docSnap: DocumentSnapshot) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            // isApproved: true means they can access the app
            setIsAllowed(data.isApproved === true);
          } else {
            // No profile yet, not allowed
            setIsAllowed(false);
          }
          setLoading(false);
        }, (error) => {
          console.error("Profile check error:", error);
          setIsAllowed(false);
          setLoading(false);
        });
      } else {
        if (allowedUnsub) allowedUnsub();
        setIsAllowed(false);
        setLoading(false);
      }
    });

    return () => {
      unsub();
      if (allowedUnsub) allowedUnsub();
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAllowed, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
