import { db } from '../config';
import {
  collection, doc, getDocs, updateDoc, deleteDoc,
  query, orderBy, serverTimestamp, arrayUnion, arrayRemove, Timestamp,
} from 'firebase/firestore';

export interface Announcement {
  id: string;
  title: string;
  body: string;
  authorId: string;
  authorName: string;
  reactions: Record<string, string[]>;
  createdAt: Timestamp;
}

export const getAnnouncements = async (): Promise<Announcement[]> => {
  const snap = await getDocs(query(collection(db, 'announcements'), orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => ({ id: d.id, reactions: {}, ...d.data() }) as Announcement);
};

// Announcement creation happens server-side (/api/publish-announcement) so the
// team notification email is sent atomically with the write.

export const updateAnnouncement = async (
  id: string,
  data: { title: string; body: string }
): Promise<void> => {
  await updateDoc(doc(db, 'announcements', id), { ...data, updatedAt: serverTimestamp() });
};

export const deleteAnnouncement = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'announcements', id));
};

// Toggle a user's reaction. `active` = the user has already reacted with this key.
export const toggleAnnouncementReaction = async (
  id: string,
  key: string,
  uid: string,
  active: boolean
): Promise<void> => {
  await updateDoc(doc(db, 'announcements', id), {
    [`reactions.${key}`]: active ? arrayRemove(uid) : arrayUnion(uid),
  });
};
