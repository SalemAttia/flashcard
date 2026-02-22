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
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let allowedUnsub: () => void;

    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);

      if (u && u.email) {
        // If logged in, monitor their allowed_users document
        const cleanEmail = u.email.trim().toLowerCase();
        const userRef = doc(db, "allowed_users", cleanEmail);

        allowedUnsub = onSnapshot(userRef, (docSnap: DocumentSnapshot) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.status === "disabled") {
              // User has been disabled by admin!
              firebaseSignOut(auth).catch(console.error);
            }
          }
        });
      } else {
        if (allowedUnsub) allowedUnsub();
      }

      setLoading(false);
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
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
