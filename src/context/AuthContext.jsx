import { createContext, useContext, useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { onAuthChange } from '../firebase/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);       // Firebase auth user
  const [profile, setProfile] = useState(null); // Firestore user profile
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubProfile = null;
    const unsubAuth = onAuthChange((firebaseUser) => {
      if (unsubProfile) { unsubProfile(); unsubProfile = null; }
      if (firebaseUser) {
        setUser(firebaseUser);
        // Live profile subscription: role changes / promotions apply without re-login
        unsubProfile = onSnapshot(
          doc(db, 'users', firebaseUser.uid),
          (snap) => {
            setProfile(snap.exists() ? snap.data() : null);
            setLoading(false);
          },
          () => { setProfile(null); setLoading(false); }
        );
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => { if (unsubProfile) unsubProfile(); unsubAuth(); };
  }, []);

  // Kept for API compatibility — the onSnapshot subscription already keeps
  // the profile in sync, so callers don't need to do anything.
  const refreshProfile = async () => {};

  const isAdmin = profile?.role === 'admin';
  const isMonitorLeader = profile?.role === 'monitor_leader';
  const isCustomer = profile?.role === 'customer';

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin, isMonitorLeader, isCustomer, refreshProfile }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
};
