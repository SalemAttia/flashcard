import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, onSnapshot, DocumentSnapshot, updateDoc, setDoc, serverTimestamp } from "firebase/firestore";
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
      if (u) {
        // Keep loading true until Firestore snapshot resolves approval status.
        // Don't set user yet — setting user while isAllowed is stale causes
        // the layout guard to briefly route to the waitlist page.
        setLoading(true);
        const userRef = doc(db, "users", u.uid);

        allowedUnsub = onSnapshot(userRef, (docSnap: DocumentSnapshot) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setIsAllowed(data.isApproved === true);
          } else {
            setIsAllowed(false);
          }
          // Set user and loading together so the guard never sees
          // user=set + isAllowed=stale
          setUser(u);
          setLoading(false);
        }, (error) => {
          console.error("Profile check error:", error);
          setIsAllowed(false);
          setUser(u);
          setLoading(false);
        });
      } else {
        if (allowedUnsub) allowedUnsub();
        setUser(null);
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
    const res = await createUserWithEmailAndPassword(auth, email, password);
    // Initialize user document
    await setDoc(doc(db, "users", res.user.uid), {
      email,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      isApproved: false, // Default to false for manual approval
    });
  };

  const signIn = async (email: string, password: string) => {
    const res = await signInWithEmailAndPassword(auth, email, password);
    // Update last login
    await updateDoc(doc(db, "users", res.user.uid), {
      lastLogin: serverTimestamp(),
    });
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
