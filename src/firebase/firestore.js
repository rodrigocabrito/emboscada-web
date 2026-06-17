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
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';

// ─── USERS ───────────────────────────────────────────────────────────────────

export const getUsers = async () => {
  const snapshot = await getDocs(collection(db, 'users'));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const deleteUserProfile = async (uid) => {
  await deleteDoc(doc(db, 'users', uid));
};

// ─── CUSTOMERS ───────────────────────────────────────────────────────────────

export const getCustomers = async () => {
  const snapshot = await getDocs(collection(db, 'customers'));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getCustomer = async (id) => {
  const docSnap = await getDoc(doc(db, 'customers', id));
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
};

export const addCustomer = async (data) => {
  return await addDoc(collection(db, 'customers'), {
    ...data,
    createdAt: new Date().toISOString(),
  });
};

export const updateCustomer = async (id, data) => {
  await updateDoc(doc(db, 'customers', id), {
    ...data,
    updatedAt: new Date().toISOString(),
  });
};

export const deleteCustomer = async (id) => {
  await deleteDoc(doc(db, 'customers', id));
};

// ─── EVENTS ──────────────────────────────────────────────────────────────────

export const getEvents = async () => {
  const q = query(collection(db, 'events'), orderBy('date', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getEvent = async (id) => {
  const docSnap = await getDoc(doc(db, 'events', id));
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
};

export const addEvent = async (data) => {
  return await addDoc(collection(db, 'events'), {
    ...data,
    createdAt: new Date().toISOString(),
  });
};

export const updateEvent = async (id, data) => {
  await updateDoc(doc(db, 'events', id), {
    ...data,
    updatedAt: new Date().toISOString(),
  });
};

export const deleteEvent = async (id) => {
  await deleteDoc(doc(db, 'events', id));
};

// ─── BOOKINGS ────────────────────────────────────────────────────────────────

export const getBookings = async () => {
  const snapshot = await getDocs(collection(db, 'bookings'));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getBookingsByCustomer = async (customerId) => {
  const q = query(collection(db, 'bookings'), where('customerId', '==', customerId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getBookingsByEvent = async (eventId) => {
  const q = query(collection(db, 'bookings'), where('eventId', '==', eventId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const addBooking = async (data) => {
  return await addDoc(collection(db, 'bookings'), {
    ...data,
    status: 'pending',
    createdAt: new Date().toISOString(),
  });
};

export const updateBooking = async (id, data) => {
  await updateDoc(doc(db, 'bookings', id), {
    ...data,
    updatedAt: new Date().toISOString(),
  });
};

export const deleteBooking = async (id) => {
  await deleteDoc(doc(db, 'bookings', id));
};

// ─── SESSIONS ────────────────────────────────────────────────────────────────

export const getSessions = async () => {
  const q = query(collection(db, 'sessions'), orderBy('sessionDate', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const addSession = async (data) => {
  const uuid = crypto.randomUUID();
  const sessionDate = new Date(data.sessionDate);

  // New sessions always start with signalPaid: false and status: pending_payment
  await setDoc(doc(db, 'sessions', uuid), {
    uuid,
    spoc: data.spoc,
    numberOfPlayers: data.numberOfPlayers,
    sessionDate: Timestamp.fromDate(sessionDate),
    status: 'pending_payment',
    additionalComments: data.additionalComments,
    monitors: data.monitors || [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return uuid;
};

export const updateSessionStatus = async (id, status) => {
  await updateDoc(doc(db, 'sessions', id), {
    status: status,
    updatedAt: serverTimestamp(),
  });
};

export const updateSession = async (id, data) => {
  const updateData = { ...data, updatedAt: serverTimestamp() };
  if (data.sessionDate) {
    updateData.sessionDate = Timestamp.fromDate(new Date(data.sessionDate));
  }
  await updateDoc(doc(db, 'sessions', id), updateData);
};

export const deleteSession = async (id) => {
  await deleteDoc(doc(db, 'sessions', id));
};
