import { db } from '../config';
import { collection, getDocs } from 'firebase/firestore';
import type { User } from '../../types';

export const getUsers = async (): Promise<User[]> => {
  const snapshot = await getDocs(collection(db, 'users'));
  return snapshot.docs.map((d) => ({ uuid: d.id, ...d.data() }) as User);
};

// User creation/deletion is handled server-side via /api/admin-users so the
// Auth account is managed together with the profile.
