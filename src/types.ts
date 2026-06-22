import type { Timestamp } from 'firebase/firestore';

export type SessionType =
  | 'Paintball'
  | 'Paintball Kids'
  | 'Laser Tag'
  | 'Laser Tag Kids'
  | 'Gel Blast'
  | 'Bubble Football';

export type SessionStatus = 'pending_payment' | 'active' | 'done' | 'cancelled' | 'no_show';

export type PaymentType = 'card' | 'mbway' | 'cash';

export type UserRole = 'admin' | 'monitor' | 'customer';

export interface LineItem {
  catalogId: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface Session {
  id: string;
  uuid: string;
  spocName: string;
  spocEmail: string;
  spocPhoneNumber: string;
  expectedNumberOfPlayers: number;
  actualNumberOfPlayers: number | null;
  sessionDate: string;
  sessionTime: string;
  sessionDatetime: string;
  typeOfSession: SessionType | '';
  caliber: string;
  status: SessionStatus;
  additionalComments: string;
  monitors: string[];
  packId: string;
  packName: string;
  numPacks: number;
  packPrice: number;
  extras: LineItem[];
  others: LineItem[];
  signal: number;
  paymentTypes: PaymentType[];
  cashPaid: number | null;
  total: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  /** @deprecated use spocName */
  spoc?: string;
  /** @deprecated use expectedNumberOfPlayers */
  numberOfPlayers?: number;
}

export interface User {
  uuid: string;
  email: string;
  firstName: string;
  lastName: string;
  nickname?: string;
  role: UserRole;
}

export type CatalogCategory = SessionType | 'Extras' | 'Outro';

export interface CatalogItem {
  id: string;
  name: string;
  category: CatalogCategory;
  price: number;
  active: boolean;
  order?: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Availability {
  userId: string;
  date: string;
  available: boolean;
  typeOfAvailability: string;
  earlierLimit: string;
  laterLimit: string;
  updatedAt: Timestamp;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phoneNumber?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Booking {
  id: string;
  customerId: string;
  eventId: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Event {
  id: string;
  date: string;
  createdAt: string;
  updatedAt?: string;
}

export interface SessionFilters {
  typeOfSession?: SessionType[];
  status?: SessionStatus[];
  dateFrom?: string;
  dateTo?: string;
}

export interface SessionsPage {
  sessions: Session[];
  lastDoc: import('firebase/firestore').DocumentSnapshot | null;
  hasMore: boolean;
}
