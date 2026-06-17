import { auth, db } from './config';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';

const DEFAULT_PASSWORD = 'Emboscada1234#';

// Create a new user (logs out current admin as a Firebase side effect)
export const createUser = async (email, firstName, lastName, role, additionalData = {}) => {
  // Create Firebase Auth user
  const userCredential = await createUserWithEmailAndPassword(auth, email, DEFAULT_PASSWORD);
  const user = userCredential.user;

  // Save profile to Firestore
  await setDoc(doc(db, 'users', user.uid), {
    uuid: user.uid,
    email,
    firstName,
    lastName,
    role,
    ...additionalData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Log out the newly created user so admin can re-login
  await signOut(auth);

  return user;
};

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
};
