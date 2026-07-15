// Shared session-domain constants. Single source of truth — these used to be
// duplicated across pages and drifted (e.g. TIME_SLOTS once had two ranges).

export const SESSION_TYPES = ['Paintball', 'Paintball Kids', 'Laser Tag', 'Laser Tag Kids', 'Gel Blast', 'Bubble Football'];

export const CALIBERS = ['.50', '.68'];

// Session types that carry a caliber
export const CALIBER_TYPES = ['Paintball', 'Paintball Kids'];

export const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => [
  `${String(i).padStart(2, '0')}:00`,
  `${String(i).padStart(2, '0')}:30`,
]).flat().filter((t) => t >= '06:00' && t <= '23:30');

export const STATUS_OPTIONS = [
  { value: 'done', label: 'Feita' },
  { value: 'active', label: 'Ativa' },
  { value: 'pending_payment', label: 'Pendente' },
  { value: 'no_show', label: 'Não compareceu' },
  { value: 'cancelled', label: 'Cancelada' },
];

export const getStatusLabel = (status) =>
  STATUS_OPTIONS.find((s) => s.value === status)?.label ?? status;

export const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'done': return 'badge-success';
    case 'active': return 'badge-active';
    case 'pending_payment': return 'badge-pending';
    case 'no_show': return 'badge-danger';
    case 'cancelled': return 'badge-default';
    default: return 'badge-default';
  }
};

// Colored chip per session type (inline-styled badges)
export const TYPE_BADGE = {
  'Paintball': { bg: '#dcfce7', color: '#166534' },
  'Paintball Kids': { bg: '#dcfce7', color: '#166534' },
  'Laser Tag': { bg: '#dbeafe', color: '#1d4ed8' },
  'Laser Tag Kids': { bg: '#dbeafe', color: '#1d4ed8' },
  'Gel Blast': { bg: '#fef3c7', color: '#92400e' },
  'Bubble Football': { bg: '#f3e8ff', color: '#7e22ce' },
};
