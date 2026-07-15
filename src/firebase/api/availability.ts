import { db } from '../config';
import {
  collection, doc, setDoc, getDocs, deleteDoc,
  query, where, documentId, serverTimestamp,
} from 'firebase/firestore';
import type { Availability } from '../../types';

const availDocId = (userId: string, date: string) => `${userId}_${date}`;

interface SetAvailabilityInput {
  available: boolean;
  typeOfAvailability?: string;
  earlierLimit?: string;
  laterLimit?: string;
}

export const setAvailability = async (userId: string, date: string, data: SetAvailabilityInput): Promise<void> => {
  await setDoc(doc(db, 'availability', availDocId(userId, date)), {
    userId,
    date,
    available: data.available,
    typeOfAvailability: data.typeOfAvailability || '',
    earlierLimit: data.earlierLimit || '',
    laterLimit: data.laterLimit || '',
    updatedAt: serverTimestamp(),
  });
};

export const getAvailabilityForMonth = async (userId: string, yearMonth: string): Promise<Record<number, Availability>> => {
  // Doc ids are `${userId}_${YYYY-MM-DD}` (see availDocId), so an ID range reads
  // exactly one user-month without needing a composite index.
  const q = query(
    collection(db, 'availability'),
    where(documentId(), '>=', `${userId}_${yearMonth}-01`),
    where(documentId(), '<=', `${userId}_${yearMonth}-31`)
  );
  const snapshot = await getDocs(q);
  const map: Record<number, Availability> = {};
  snapshot.docs.forEach((d) => {
    const data = d.data() as Availability;
    if (data.userId === userId && data.date?.startsWith(yearMonth)) {
      const day = parseInt(data.date.split('-')[2], 10);
      map[day] = data;
    }
  });
  return map;
};

export const deleteAvailability = async (userId: string, date: string): Promise<void> => {
  await deleteDoc(doc(db, 'availability', availDocId(userId, date)));
};

export const getAvailabilityForDate = async (date: string): Promise<Availability[]> => {
  const q = query(collection(db, 'availability'), where('date', '==', date));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => d.data() as Availability);
};
