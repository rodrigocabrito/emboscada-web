import { db } from '../config';
import {
  collection, doc, addDoc, getDocs, updateDoc, deleteDoc,
  query, orderBy, serverTimestamp,
} from 'firebase/firestore';
import type { CatalogItem } from '../../types';

export const getCatalogItems = async (): Promise<CatalogItem[]> => {
  const q = query(collection(db, 'catalog'), orderBy('createdAt', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as CatalogItem);
};

export const addCatalogItem = async (data: Omit<CatalogItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<import('firebase/firestore').DocumentReference> => {
  return await addDoc(collection(db, 'catalog'), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const updateCatalogItem = async (id: string, data: Partial<Omit<CatalogItem, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> => {
  await updateDoc(doc(db, 'catalog', id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const deleteCatalogItem = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'catalog', id));
};
