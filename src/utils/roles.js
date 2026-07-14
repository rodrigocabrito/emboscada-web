// Central role definitions so labels/logic stay consistent across the app.
// Hierarchy: admin > monitor_leader > monitor (> customer).

export const ROLE_OPTIONS = [
  { value: 'admin', label: 'Administrador(a)' },
  { value: 'monitor_leader', label: 'Monitor(a) Líder' },
  { value: 'monitor', label: 'Monitor(a)' },
];

export const ROLE_LABELS = {
  admin: 'Administrador(a)',
  monitor_leader: 'Monitor(a) Líder',
  monitor: 'Monitor(a)',
  customer: 'Cliente',
};

export const roleLabel = (role) => ROLE_LABELS[role] ?? role;

// Staff roles that can be assigned to a session as a monitor
export const isAssignableMonitor = (role) =>
  role === 'admin' || role === 'monitor_leader' || role === 'monitor';
