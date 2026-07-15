import useEscapeKey from '../../../hooks/useEscapeKey';
import { getUserColor } from '../../../utils/avatarColors';
import { getStatusLabel, getStatusBadgeClass } from '../../../constants/sessions';

const SessionViewModal = ({ session, users, onClose, onEdit }) => {
  useEscapeKey(onClose);

  const monitors = (session.monitors || [])
    .map((uid) => users.find((u) => u.uuid === uid))
    .filter(Boolean);

  const dateFormatted = session.sessionDate
    ? new Date(session.sessionDate + 'T00:00').toLocaleDateString('pt-PT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : '—';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <h2 className="modal-title">Sessão</h2>
          <button className="modal-close" onClick={onClose} aria-label="Fechar">✕</button>
        </div>

        <div className="session-view-body">
          <div className="session-view-row">
            <span className="session-view-label">Responsável</span>
            <span className="session-view-value">{session.spocName || session.spoc || '—'}</span>
          </div>
          <div className="session-view-row">
            <span className="session-view-label">Nº de Jogadores</span>
            <span className="session-view-value">{session.expectedNumberOfPlayers ?? session.numberOfPlayers ?? '—'}</span>
          </div>
          <div className="session-view-row">
            <span className="session-view-label">Data</span>
            <span className="session-view-value" style={{ textTransform: 'capitalize' }}>{dateFormatted}</span>
          </div>
          <div className="session-view-row">
            <span className="session-view-label">Hora</span>
            <span className="session-view-value">{session.sessionTime || '—'}</span>
          </div>
          {session.spocEmail && (
            <div className="session-view-row">
              <span className="session-view-label">Email</span>
              <span className="session-view-value">{session.spocEmail}</span>
            </div>
          )}
          {session.spocPhoneNumber && (
            <div className="session-view-row">
              <span className="session-view-label">Telemóvel</span>
              <span className="session-view-value">{session.spocPhoneNumber}</span>
            </div>
          )}
          {session.typeOfSession && (
            <div className="session-view-row">
              <span className="session-view-label">Tipo de Sessão</span>
              <span className="session-view-value">{session.typeOfSession}</span>
            </div>
          )}
          {session.caliber && (
            <div className="session-view-row">
              <span className="session-view-label">Calibre</span>
              <span className="session-view-value">{session.caliber}</span>
            </div>
          )}
          <div className="session-view-row">
            <span className="session-view-label">Estado</span>
            <span className={`badge ${getStatusBadgeClass(session.status)}`} style={{ fontSize: '0.78rem' }}>
              {getStatusLabel(session.status)}
            </span>
          </div>
          {monitors.length > 0 && (
            <div className="session-view-row">
              <span className="session-view-label">Monitor(es)</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {monitors.map((m) => {
                  const color = getUserColor(m.uuid);
                  return (
                    <span key={m.uuid} className="grid-monitor-dot" style={{ backgroundColor: color }}>
                      {m.nickname || `${m.firstName} ${m.lastName}`}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
          {session.additionalComments && (
            <div className="session-view-row session-view-comments">
              <span className="session-view-label">Comentários</span>
              <span className="session-view-value">{session.additionalComments}</span>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-primary" onClick={() => onEdit(session.id)}>
            Editar
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionViewModal;
