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

export const getSession = async (id) => {
  const docSnap = await getDoc(doc(db, 'sessions', id));
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
};

export const getSessions = async () => {
  const q = query(collection(db, 'sessions'), orderBy('sessionDatetime', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const addSession = async (data) => {
  const uuid = crypto.randomUUID();
  // sessionDatetime = "YYYY-MM-DDTHH:MM" — timezone-free sort key
  const sessionDatetime = `${data.sessionDate}T${data.sessionTime}`;

  await setDoc(doc(db, 'sessions', uuid), {
    uuid,
    spoc: data.spoc,
    numberOfPlayers: data.numberOfPlayers,
    sessionDate: data.sessionDate,       // "YYYY-MM-DD"
    sessionTime: data.sessionTime,       // "HH:MM"
    sessionDatetime,                     // "YYYY-MM-DDTHH:MM" for ordering
    typeOfSession: data.typeOfSession || '',
    caliber: data.caliber || '',
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
    status,
    updatedAt: serverTimestamp(),
  });
};

export const updateSession = async (id, data) => {
  const updateData = { ...data, updatedAt: serverTimestamp() };
  // Rebuild sessionDatetime if date or time changed
  if (data.sessionDate || data.sessionTime) {
    updateData.sessionDatetime = `${data.sessionDate}T${data.sessionTime}`;
  }
  await updateDoc(doc(db, 'sessions', id), updateData);
};

export const deleteSession = async (id) => {
  await deleteDoc(doc(db, 'sessions', id));
};

// ─── AVAILABILITY ─────────────────────────────────────────────────────────────

const availDocId = (userId, date) => `${userId}_${date}`;

export const setAvailability = async (userId, date, data) => {
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

export const getAvailabilityForMonth = async (userId, yearMonth) => {
  const q = query(collection(db, 'availability'), where('userId', '==', userId));
  const snapshot = await getDocs(q);
  const map = {};
  snapshot.docs.forEach((d) => {
    const data = d.data();
    if (data.date?.startsWith(yearMonth)) {
      const day = parseInt(data.date.split('-')[2], 10);
      map[day] = data;
    }
  });
  return map;
};

export const deleteAvailability = async (userId, date) => {
  await deleteDoc(doc(db, 'availability', availDocId(userId, date)));
};

export const getAvailabilityForDate = async (date) => {
  const q = query(collection(db, 'availability'), where('date', '==', date));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => d.data());
};
