import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthChange, getUserProfile } from '../firebase/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);       // Firebase auth user
  const [profile, setProfile] = useState(null); // Firestore user profile
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const userProfile = await getUserProfile(firebaseUser.uid);
        setProfile(userProfile);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (user) {
      const userProfile = await getUserProfile(user.uid);
      setProfile(userProfile);
    }
  };

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
