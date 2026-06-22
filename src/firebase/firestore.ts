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

export const deleteUserProfile = async (uid: string): Promise<void> => {
  await deleteDoc(doc(db, 'users', uid));
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
  const q = query(collection(db, 'availability'), where('userId', '==', userId));
  const snapshot = await getDocs(q);
  const map: Record<number, Availability> = {};
  snapshot.docs.forEach((d) => {
    const data = d.data() as Availability;
    if (data.date?.startsWith(yearMonth)) {
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
