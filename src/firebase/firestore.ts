// Barrel for the Firestore data layer, split by domain under ./api.
// Import sites keep using `from '../firebase/firestore'` unchanged.
export * from './api/users';
export * from './api/evaluations';
export * from './api/ammo';
export * from './api/announcements';
export * from './api/sessions';
export * from './api/catalog';
export * from './api/availability';
export * from './api/crm';
