import { db } from '../config';
import {
  collection, doc, addDoc, getDoc, getDocs, updateDoc, deleteDoc,
  query, where, orderBy,
} from 'firebase/firestore';
import type { Customer, Booking, Event } from '../../types';

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
