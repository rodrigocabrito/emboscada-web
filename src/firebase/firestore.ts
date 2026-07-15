import { db } from './config';
import {
  collection,
  doc,
  setDoc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getCountFromServer,
  serverTimestamp,
  runTransaction,
  arrayUnion,
  arrayRemove,
  documentId,
  Timestamp,
  DocumentSnapshot,
  type QueryConstraint,
} from 'firebase/firestore';
import type {
  Session,
  User,
  CatalogItem,
  Customer,
  Booking,
  Event,
  Availability,
  SessionFilters,
  SessionsPage,
  LineItem,
  PaymentType,
  SessionType,
  SessionStatus,
} from '../types';

// ─── USERS ───────────────────────────────────────────────────────────────────

export const getUsers = async (): Promise<User[]> => {
  const snapshot = await getDocs(collection(db, 'users'));
  return snapshot.docs.map((d) => ({ uuid: d.id, ...d.data() }) as User);
};

// User deletion is handled server-side via /api/admin-users so the
// Auth account is removed together with the profile.

// ─── EVALUATIONS ─────────────────────────────────────────────────────────────

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

// ─── AMMO STOCK ──────────────────────────────────────────────────────────────

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

const ammoStockDocId = (caliber: string) => `stock_${caliber.replace('.', '')}`;

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
// Base = most recent count entry; adds all restock/removal entries recorded after it.
const recalcAmmoStock = async (caliber: string): Promise<void> => {
  // Filter server-side; sort client-side to avoid needing a composite index
  const snap = await getDocs(query(collection(db, 'ammoRestocks'), where('caliber', '==', caliber)));
  const entries = snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as AmmoRestock))
    .sort((a, b) => (a.createdAt?.toMillis?.() ?? 0) - (b.createdAt?.toMillis?.() ?? 0));

  let baseAmount = 0;
  let baseIdx = -1;
  for (let i = entries.length - 1; i >= 0; i--) {
    if (entries[i].type === 'count') {
      baseAmount = entries[i].amount;
      baseIdx = i;
      break;
    }
  }

  const delta = entries
    .slice(baseIdx + 1)
    .reduce((sum, r) => sum + (r.amount ?? 0), 0);

  const ref = doc(db, 'ammo', ammoStockDocId(caliber));
  await setDoc(ref, { currentStock: baseAmount + delta, updatedAt: serverTimestamp() }, { merge: true });
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

// ─── ANNOUNCEMENTS ───────────────────────────────────────────────────────────

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

// ─── CUSTOMERS ───────────────────────────────────────────────────────────────

export const getCustomers = async (): Promise<Customer[]> => {
  const snapshot = await getDocs(collection(db, 'customers'));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Customer);
};

export const getCustomer = async (id: string): Promise<Customer | null> => {
  const docSnap = await getDoc(doc(db, 'customers', id));
  return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as Customer) : null;
};

export const addCustomer = async (data: Omit<Customer, 'id' | 'createdAt'>): Promise<import('firebase/firestore').DocumentReference> => {
  return await addDoc(collection(db, 'customers'), {
    ...data,
    createdAt: new Date().toISOString(),
  });
};

export const updateCustomer = async (id: string, data: Partial<Customer>): Promise<void> => {
  await updateDoc(doc(db, 'customers', id), {
    ...data,
    updatedAt: new Date().toISOString(),
  });
};

export const deleteCustomer = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'customers', id));
};

// ─── EVENTS ──────────────────────────────────────────────────────────────────

export const getEvents = async (): Promise<Event[]> => {
  const q = query(collection(db, 'events'), orderBy('date', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Event);
};

export const getEvent = async (id: string): Promise<Event | null> => {
  const docSnap = await getDoc(doc(db, 'events', id));
  return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as Event) : null;
};

export const addEvent = async (data: Omit<Event, 'id' | 'createdAt'>): Promise<import('firebase/firestore').DocumentReference> => {
  return await addDoc(collection(db, 'events'), {
    ...data,
    createdAt: new Date().toISOString(),
  });
};

export const updateEvent = async (id: string, data: Partial<Event>): Promise<void> => {
  await updateDoc(doc(db, 'events', id), {
    ...data,
    updatedAt: new Date().toISOString(),
  });
};

export const deleteEvent = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'events', id));
};

// ─── BOOKINGS ────────────────────────────────────────────────────────────────

export const getBookings = async (): Promise<Booking[]> => {
  const snapshot = await getDocs(collection(db, 'bookings'));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Booking);
};

export const getBookingsByCustomer = async (customerId: string): Promise<Booking[]> => {
  const q = query(collection(db, 'bookings'), where('customerId', '==', customerId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Booking);
};

export const getBookingsByEvent = async (eventId: string): Promise<Booking[]> => {
  const q = query(collection(db, 'bookings'), where('eventId', '==', eventId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Booking);
};

export const addBooking = async (data: Omit<Booking, 'id' | 'status' | 'createdAt'>): Promise<import('firebase/firestore').DocumentReference> => {
  return await addDoc(collection(db, 'bookings'), {
    ...data,
    status: 'pending',
    createdAt: new Date().toISOString(),
  });
};

export const updateBooking = async (id: string, data: Partial<Booking>): Promise<void> => {
  await updateDoc(doc(db, 'bookings', id), {
    ...data,
    updatedAt: new Date().toISOString(),
  });
};

export const deleteBooking = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'bookings', id));
};

// ─── SESSIONS ────────────────────────────────────────────────────────────────

export const getSession = async (id: string): Promise<Session | null> => {
  const docSnap = await getDoc(doc(db, 'sessions', id));
  return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as Session) : null;
};

export const getSessions = async (): Promise<Session[]> => {
  const q = query(collection(db, 'sessions'), orderBy('sessionDatetime', 'asc'));
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

    const oldCaliber = old.caliber || '';
    const oldBullets = old.bulletsSpent ?? 0;
    // Fields absent from the payload (e.g. non-admin saves) mean "unchanged"
    const newCaliber = data.caliber !== undefined ? (data.caliber || '') : oldCaliber;
    const newBullets = data.bulletsSpent !== undefined ? (data.bulletsSpent ?? 0) : oldBullets;

    // Per-caliber stock deltas (positive = bullets returned to stock)
    const deltas: Record<string, number> = {};
    if (newCaliber === oldCaliber) {
      if (newCaliber && newBullets !== oldBullets) deltas[newCaliber] = -(newBullets - oldBullets);
    } else {
      if (oldCaliber && oldBullets !== 0) deltas[oldCaliber] = (deltas[oldCaliber] ?? 0) + oldBullets;
      if (newCaliber && newBullets !== 0) deltas[newCaliber] = (deltas[newCaliber] ?? 0) - newBullets;
    }

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

// ─── CATALOG ─────────────────────────────────────────────────────────────────

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

// ─── AVAILABILITY ─────────────────────────────────────────────────────────────

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
