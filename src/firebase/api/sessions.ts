import { db } from '../config';
import {
  collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc,
  query, where, orderBy, limit, startAfter, getCountFromServer,
  serverTimestamp, runTransaction,
  DocumentSnapshot, type QueryConstraint,
} from 'firebase/firestore';
import { ammoStockDocId } from './ammo';
import { computeAmmoDeltas } from '../../utils/stockMath';
import type {
  Session, SessionFilters, SessionsPage, LineItem, PaymentType, SessionType, SessionStatus,
} from '../../types';

export const getSession = async (id: string): Promise<Session | null> => {
  const docSnap = await getDoc(doc(db, 'sessions', id));
  return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as Session) : null;
};

export const getSessions = async (): Promise<Session[]> => {
  const q = query(collection(db, 'sessions'), orderBy('sessionDatetime', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Session);
};

// One calendar month of sessions (yearMonth = "YYYY-MM") — bounded read for
// the calendar. Single-field range on sessionDatetime, no composite index.
export const getSessionsForMonth = async (yearMonth: string): Promise<Session[]> => {
  const q = query(
    collection(db, 'sessions'),
    where('sessionDatetime', '>=', `${yearMonth}-01T00:00`),
    where('sessionDatetime', '<=', `${yearMonth}-31T23:59`),
    orderBy('sessionDatetime', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Session);
};

// Sessions from the start of today onward — bounded read for the dashboard
export const getUpcomingSessions = async (): Promise<Session[]> => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  const todayStart = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T00:00`;
  const q = query(
    collection(db, 'sessions'),
    where('sessionDatetime', '>=', todayStart),
    orderBy('sessionDatetime', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Session);
};

// Aggregation queries: count sessions per monitor without downloading them
export const getMonitorSessionCount = async (uid: string): Promise<number> => {
  const snap = await getCountFromServer(
    query(collection(db, 'sessions'), where('monitors', 'array-contains', uid))
  );
  return snap.data().count;
};

export const getMonitorSessionCounts = async (uids: string[]): Promise<Record<string, number>> => {
  const entries = await Promise.all(
    uids.map(async (uid) => [uid, await getMonitorSessionCount(uid)] as const)
  );
  return Object.fromEntries(entries);
};

const buildSessionConstraints = (filters: SessionFilters = {}): QueryConstraint[] => {
  const c: QueryConstraint[] = [];
  const types = filters.typeOfSession ?? [];
  const statuses = filters.status ?? [];
  // Firestore allows at most one 'in' operator per query — typeOfSession takes priority
  if (types.length > 0) {
    c.push(where('typeOfSession', 'in', types));
  } else if (statuses.length > 0) {
    c.push(where('status', 'in', statuses));
  }
  if (filters.dateFrom) c.push(where('sessionDatetime', '>=', filters.dateFrom));
  if (filters.dateTo) c.push(where('sessionDatetime', '<=', filters.dateTo + 'T23:59'));
  return c;
};

export const getSessionsAll = async (filters: SessionFilters = {}): Promise<Session[]> => {
  const hasEqualityFilter = !!(filters.typeOfSession?.length || filters.status?.length);
  const constraints = buildSessionConstraints(filters);
  if (!hasEqualityFilter) constraints.unshift(orderBy('sessionDatetime', 'asc'));
  const snapshot = await getDocs(query(collection(db, 'sessions'), ...constraints));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Session);
};

export const getSessionsCount = async (filters: SessionFilters = {}): Promise<number> => {
  const constraints = buildSessionConstraints(filters);
  const q = constraints.length ? query(collection(db, 'sessions'), ...constraints) : collection(db, 'sessions');
  const snap = await getCountFromServer(q);
  return snap.data().count;
};

export const getSessionsPage = async (
  pageSize = 30,
  afterDoc: DocumentSnapshot | null = null,
  filters: SessionFilters = {}
): Promise<SessionsPage> => {
  const hasEqualityFilter = !!(filters.typeOfSession?.length || filters.status?.length);
  const constraints = buildSessionConstraints(filters);
  // orderBy on a different field than the where clause needs a composite index.
  // Skip it when equality filters are active — results are sorted client-side instead.
  if (!hasEqualityFilter) constraints.unshift(orderBy('sessionDatetime', 'asc'));
  if (afterDoc) constraints.push(startAfter(afterDoc));
  constraints.push(limit(pageSize));
  const snapshot = await getDocs(query(collection(db, 'sessions'), ...constraints));
  return {
    sessions: snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Session),
    lastDoc: snapshot.docs[snapshot.docs.length - 1] ?? null,
    hasMore: snapshot.docs.length === pageSize,
  };
};

interface AddSessionInput {
  spocName: string;
  spocEmail: string;
  spocPhoneNumber: string;
  expectedNumberOfPlayers: number;
  sessionDate: string;
  sessionTime: string;
  typeOfSession: SessionType | '';
  caliber: string;
  additionalComments: string;
}

export const addSession = async (data: AddSessionInput): Promise<string> => {
  const uuid = crypto.randomUUID();
  // sessionDatetime = "YYYY-MM-DDTHH:MM" — timezone-free sort key
  const sessionDatetime = `${data.sessionDate}T${data.sessionTime}`;

  await setDoc(doc(db, 'sessions', uuid), {
    uuid,
    spocName: data.spocName || '',
    spocEmail: data.spocEmail || '',
    spocPhoneNumber: data.spocPhoneNumber || '',
    expectedNumberOfPlayers: data.expectedNumberOfPlayers,
    sessionDate: data.sessionDate,
    sessionTime: data.sessionTime,
    sessionDatetime,
    typeOfSession: data.typeOfSession || '',
    caliber: data.caliber || '',
    status: 'pending_payment' as SessionStatus,
    additionalComments: data.additionalComments,
    monitors: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return uuid;
};

export const updateSessionStatus = async (id: string, status: SessionStatus): Promise<void> => {
  await updateDoc(doc(db, 'sessions', id), {
    status,
    updatedAt: serverTimestamp(),
  });
};

interface UpdateSessionInput {
  spocName?: string;
  spocEmail?: string;
  spocPhoneNumber?: string;
  expectedNumberOfPlayers?: number;
  actualNumberOfPlayers?: number | null;
  sessionDate?: string;
  sessionTime?: string;
  sessionDatetime?: string;
  typeOfSession?: SessionType | '';
  caliber?: string;
  status?: SessionStatus;
  additionalComments?: string;
  monitors?: string[];
  packId?: string;
  packName?: string;
  numPacks?: number;
  packPrice?: number;
  extras?: LineItem[];
  others?: LineItem[];
  signal?: number;
  paymentTypes?: PaymentType[];
  cashPaid?: number | null;
  total?: number;
  bulletsSpent?: number | null;
}

export const updateSession = async (id: string, data: UpdateSessionInput): Promise<void> => {
  const updateData: Record<string, unknown> = { ...data, updatedAt: serverTimestamp() };
  // Rebuild sessionDatetime if date or time changed
  if (data.sessionDate || data.sessionTime) {
    updateData.sessionDatetime = `${data.sessionDate}T${data.sessionTime}`;
  }
  await updateDoc(doc(db, 'sessions', id), updateData);
};

// Saves a session AND applies the resulting ammo-stock deltas in a single
// transaction. Old bullets/caliber are read from the database inside the
// transaction (not from client state), so concurrent edits and live-listener
// staleness can't corrupt the stock.
export const saveSessionWithAmmo = async (id: string, data: UpdateSessionInput): Promise<void> => {
  const sessionRef = doc(db, 'sessions', id);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(sessionRef);
    if (!snap.exists()) throw new Error('Session not found');
    const old = snap.data() as Session;

    const deltas = computeAmmoDeltas(old, data);

    // All reads must happen before writes in a Firestore transaction
    const entries = Object.entries(deltas).filter(([, d]) => d !== 0);
    const stockSnaps = [];
    for (const [cal] of entries) {
      stockSnaps.push(await tx.get(doc(db, 'ammo', ammoStockDocId(cal))));
    }

    const updateData: Record<string, unknown> = { ...data, updatedAt: serverTimestamp() };
    if (data.sessionDate || data.sessionTime) {
      updateData.sessionDatetime = `${data.sessionDate}T${data.sessionTime}`;
    }
    tx.update(sessionRef, updateData);

    entries.forEach(([cal, delta], i) => {
      const current = stockSnaps[i].exists() ? ((stockSnaps[i].data()!.currentStock as number) ?? 0) : 0;
      tx.set(doc(db, 'ammo', ammoStockDocId(cal)), { currentStock: current + delta, updatedAt: serverTimestamp() }, { merge: true });
    });
  });
};

export const deleteSession = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'sessions', id));
};
