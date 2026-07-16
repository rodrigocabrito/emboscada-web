import { db } from '../config';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

export const getEvaluation = async (uid: string): Promise<Record<string, unknown> | null> => {
  const snap = await getDoc(doc(db, 'evaluations', uid));
  return snap.exists() ? (snap.data() as Record<string, unknown>) : null;
};

export const saveEvaluation = async (uid: string, data: Record<string, unknown>): Promise<void> => {
  const ref = doc(db, 'evaluations', uid);
  const snap = await getDoc(ref);
  const saveCount = (snap.exists() ? ((snap.data().saveCount as number) ?? 0) : 0) + 1;
  await setDoc(ref, { ...data, updatedAt: serverTimestamp(), saveCount });
};

export const markEvaluationSeen = async (uid: string, saveCount: number): Promise<void> => {
  await updateDoc(doc(db, 'users', uid), { lastEvalSeenCount: saveCount });
};
