import { SESSION_TYPES, TIME_SLOTS, CALIBERS } from '../../../constants/sessions';

const NewSessionModal = ({ form, loading, error, success, onChange, onCaliberSelect, onSubmit, onClose }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal" onClick={(e) => e.stopPropagation()}>
      <div className="modal-header">
        <h2 className="modal-title">Nova Sessão</h2>
        <button className="modal-close" onClick={onClose} aria-label="Fechar">✕</button>
      </div>

      <form onSubmit={onSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="spocName">Responsável (Cliente)</label>
            <input
              id="spocName"
              name="spocName"
              type="text"
              value={form.spocName}
              onChange={onChange}
              placeholder="Nome do responsável"
              autoFocus
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="expectedNumberOfPlayers">Nº de Jogadores</label>
            <input
              id="expectedNumberOfPlayers"
              name="expectedNumberOfPlayers"
              type="number"
              min="1"
              value={form.expectedNumberOfPlayers}
              onChange={onChange}
              placeholder="Ex: 10"
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="spocEmail">Email</label>
            <input
              id="spocEmail"
              name="spocEmail"
              type="email"
              value={form.spocEmail}
              onChange={onChange}
              placeholder="email@exemplo.com"
            />
          </div>
          <div className="form-group">
            <label htmlFor="spocPhoneNumber">Telemóvel</label>
            <input
              id="spocPhoneNumber"
              name="spocPhoneNumber"
              type="tel"
              value={form.spocPhoneNumber}
              onChange={onChange}
              placeholder="+351 9XX XXX XXX"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="sessionDay">Data</label>
            <input
              id="sessionDay"
              name="sessionDay"
              type="date"
              value={form.sessionDay}
              onChange={onChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="sessionTime">Hora</label>
            <select
              id="sessionTime"
              name="sessionTime"
              value={form.sessionTime}
              onChange={onChange}
              className="form-select"
              required
            >
              <option value="">-- Selecionar hora --</option>
              {TIME_SLOTS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="typeOfSession">Tipo de Sessão</label>
          <select
            id="typeOfSession"
            name="typeOfSession"
            value={form.typeOfSession}
            onChange={onChange}
            className="form-select"
            required
          >
            <option value="">-- Selecionar tipo --</option>
            {SESSION_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {form.typeOfSession === 'Paintball' && (
          <div className="form-group">
            <label>Calibre</label>
            <div className="caliber-toggle">
              {CALIBERS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`caliber-btn${form.caliber === c ? ' active' : ''}`}
                  onClick={() => onCaliberSelect(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="form-group">
          <label htmlFor="additionalComments">Comentários adicionais</label>
          <textarea
            id="additionalComments"
            name="additionalComments"
            value={form.additionalComments}
            onChange={onChange}
            className="form-textarea"
            placeholder="Notas, requisitos especiais..."
          />
        </div>

        {error && <div className="error-msg"><span>⚠</span> {error}</div>}
        {success && <div className="success-msg"><span>✓</span> {success}</div>}

        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
            Voltar
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'A criar...' : 'Criar Sessão'}
          </button>
        </div>
      </form>
    </div>
  </div>
);

export default NewSessionModal;
