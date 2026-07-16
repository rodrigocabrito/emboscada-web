import { auth, db } from './config';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';

// User creation/deletion is handled server-side via /api/admin-users
// (see src/utils/adminApi.js) so the admin never gets signed out and
// account credentials never live in the client bundle.

// Login
export const loginUser = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

// Logout
export const logoutUser = async () => {
  await signOut(auth);
};

// Get user profile from Firestore
export const getUserProfile = async (uid) => {
  const docRef = doc(db, 'users', uid);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data() : null;
};

// Subscribe to auth state changes
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// Update user profile fields in Firestore
export const updateUserProfile = async (uid, data) => {
  await updateDoc(doc(db, 'users', uid), {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

// Re-authenticate and change password
export const changePassword = async (currentPassword, newPassword) => {
  const user = auth.currentUser;
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
  // Clear the first-login flag (best-effort — the password change already succeeded)
  try {
    await updateDoc(doc(db, 'users', user.uid), { mustChangePassword: false, updatedAt: serverTimestamp() });
  } catch { /* non-blocking */ }
};
