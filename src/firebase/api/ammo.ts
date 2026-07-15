import { db } from '../config';
import {
  collection, doc, setDoc, addDoc, getDoc, getDocs, deleteDoc,
  query, where, serverTimestamp, runTransaction, Timestamp,
} from 'firebase/firestore';
import { computeStockFromHistory } from '../../utils/stockMath';
import type { Session } from '../../types';

export interface AmmoRestock {
  id: string;
  amount: number;
  date: string;
  note: string;
  caliber: string;
  type?: 'restock' | 'removal' | 'count';
  previousStock?: number;
  createdAt: Timestamp;
}

export const ammoStockDocId = (caliber: string) => `stock_${caliber.replace('.', '')}`;

export const getAmmoStock = async (caliber: string): Promise<number> => {
  const snap = await getDoc(doc(db, 'ammo', ammoStockDocId(caliber)));
  return snap.exists() ? ((snap.data().currentStock as number) ?? 0) : 0;
};

export const getAmmoStocks = async (): Promise<Record<string, number>> => {
  const [snap50, snap68] = await Promise.all([
    getDoc(doc(db, 'ammo', ammoStockDocId('.50'))),
    getDoc(doc(db, 'ammo', ammoStockDocId('.68'))),
  ]);
  return {
    '.50': snap50.exists() ? ((snap50.data().currentStock as number) ?? 0) : 0,
    '.68': snap68.exists() ? ((snap68.data().currentStock as number) ?? 0) : 0,
  };
};

export const adjustAmmoStock = async (delta: number, caliber: string): Promise<void> => {
  if (!caliber) return;
  const ref = doc(db, 'ammo', ammoStockDocId(caliber));
  // Transaction: atomic read-modify-write, safe under concurrent adjustments
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const current = snap.exists() ? ((snap.data().currentStock as number) ?? 0) : 0;
    tx.set(ref, { currentStock: current + delta, updatedAt: serverTimestamp() }, { merge: true });
  });
};

export const addAmmoRestock = async (amount: number, date: string, note: string, caliber: string): Promise<void> => {
  await addDoc(collection(db, 'ammoRestocks'), { amount, date, note, caliber, createdAt: serverTimestamp() });
  await adjustAmmoStock(amount, caliber);
};

export const removeAmmoStock = async (amount: number, date: string, note: string, caliber: string): Promise<void> => {
  await addDoc(collection(db, 'ammoRestocks'), { amount: -amount, date, note, caliber, type: 'removal', createdAt: serverTimestamp() });
  await adjustAmmoStock(-amount, caliber);
};

export const setAmmoStockCount = async (amount: number, date: string, note: string, caliber: string): Promise<void> => {
  const ref = doc(db, 'ammo', ammoStockDocId(caliber));
  const snap = await getDoc(ref);
  const previousStock = snap.exists() ? ((snap.data().currentStock as number) ?? 0) : 0;
  await setDoc(ref, { currentStock: amount, updatedAt: serverTimestamp() }, { merge: true });
  await addDoc(collection(db, 'ammoRestocks'), { amount, date, note, caliber, type: 'count', previousStock, createdAt: serverTimestamp() });
};

// Recalculates currentStock from the ammoRestocks history for a given caliber.
const recalcAmmoStock = async (caliber: string): Promise<void> => {
  // Filter server-side; sort client-side to avoid needing a composite index
  const snap = await getDocs(query(collection(db, 'ammoRestocks'), where('caliber', '==', caliber)));
  const entries = snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as AmmoRestock))
    .sort((a, b) => (a.createdAt?.toMillis?.() ?? 0) - (b.createdAt?.toMillis?.() ?? 0));

  const ref = doc(db, 'ammo', ammoStockDocId(caliber));
  await setDoc(ref, { currentStock: computeStockFromHistory(entries), updatedAt: serverTimestamp() }, { merge: true });
};

export const deleteAmmoRestock = async (id: string, caliber: string): Promise<void> => {
  await deleteDoc(doc(db, 'ammoRestocks', id));
  await recalcAmmoStock(caliber);
};

export const deleteAmmoCount = async (id: string, caliber: string): Promise<void> => {
  await deleteDoc(doc(db, 'ammoRestocks', id));
  await recalcAmmoStock(caliber);
};

export const getAmmoRestocks = async (caliber: string): Promise<AmmoRestock[]> => {
  // Filter server-side; sort client-side to avoid needing a composite index
  const snap = await getDocs(query(collection(db, 'ammoRestocks'), where('caliber', '==', caliber)));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as AmmoRestock)
    .sort((a, b) =>
      b.date.localeCompare(a.date)
      || ((b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0))
    );
};

export const getSessionsWithAmmo = async (): Promise<Session[]> => {
  const snap = await getDocs(query(collection(db, 'sessions'), where('bulletsSpent', '>', 0)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Session);
};
