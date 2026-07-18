import { csvNumber, csvText } from '../../utils/csv';
import { getStatusLabel } from '../../constants/sessions';

const nameOf = (u) => u?.nickname || `${u?.firstName ?? ''} ${u?.lastName ?? ''}`.trim();

// "Máscara x2 | Colete x1"
const lineItems = (items) =>
  (items ?? []).map((i) => `${i.name} x${i.quantity}`).join(' | ');

// Column set for the sessions CSV export. `usersById` resolves monitor uids.
export const sessionCsvColumns = (usersById) => [
  { label: 'Data',                  value: (s) => (s.sessionDatetime || s.sessionDate || '').slice(0, 10) },
  { label: 'Hora',                  value: (s) => s.sessionTime || (s.sessionDatetime || '').slice(11, 16) },
  { label: 'Cliente',               value: (s) => s.spocName || s.spoc || '' },
  { label: 'Email',                 value: (s) => s.spocEmail || '' },
  // Exported as text so "+" / leading zeros survive Excel's number coercion
  { label: 'Telemóvel',             value: (s) => csvText(s.spocPhoneNumber) },
  { label: 'Tipo',                  value: (s) => s.typeOfSession || '' },
  { label: 'Calibre',               value: (s) => s.caliber || '' },
  { label: 'Jogadores (Esperado)',  value: (s) => s.expectedNumberOfPlayers ?? s.numberOfPlayers ?? '' },
  { label: 'Jogadores (Real)',      value: (s) => s.actualNumberOfPlayers ?? '' },
  { label: 'Estado',                value: (s) => getStatusLabel(s.status) },
  { label: 'Monitores',             value: (s) => (s.monitors ?? []).map((id) => nameOf(usersById[id])).filter(Boolean).join(', ') },
  { label: 'Munições Gastas',       value: (s) => s.bulletsSpent ?? '' },
  { label: 'Pack',                  value: (s) => s.packName || '' },
  { label: 'Nº Packs',              value: (s) => s.numPacks ?? '' },
  { label: 'Preço/Pack',            value: (s) => csvNumber(s.packPrice) },
  { label: 'Extras',                value: (s) => lineItems(s.extras) },
  { label: 'Outros',                value: (s) => lineItems(s.others) },
  { label: 'Sinal',                 value: (s) => csvNumber(s.signal) },
  { label: 'Total',                 value: (s) => csvNumber(s.total) },
  { label: 'Pagamento',             value: (s) => (s.paymentTypes ?? []).join(', ') },
  { label: 'Comentários',           value: (s) => s.additionalComments || '' },
];
