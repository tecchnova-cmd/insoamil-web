import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
} from 'firebase/auth';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState(null);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setProfile(null);
        setLoading(false);
      }
    });
    return unsubAuth;
  }, []);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    setProfileError(null);
    const unsubProfile = onSnapshot(
      doc(db, 'users', user.uid),
      (snap) => {
        if (!snap.exists()) {
          setProfileError('Tu cuenta no tiene un perfil asignado en el panel. Contacta al superadministrador.');
          setProfile(null);
        } else {
          setProfile({ id: snap.id, ...snap.data() });
        }
        setLoading(false);
      },
      (err) => {
        setProfileError(err.message);
        setLoading(false);
      }
    );
    return unsubProfile;
  }, [user]);

  async function login(email, password) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function logout() {
    await signOut(auth);
  }

  async function resetPassword(email) {
    await sendPasswordResetEmail(auth, email);
  }

  async function changePassword(newPassword) {
    await updatePassword(auth.currentUser, newPassword);
    if (profile) {
      await updateDoc(doc(db, 'users', user.uid), {
        forcePasswordChange: false,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
      });
    }
  }

  const value = {
    user,
    profile,
    loading,
    profileError,
    isActive: profile?.active === true,
    role: profile?.role || null,
    login,
    logout,
    resetPassword,
    changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
