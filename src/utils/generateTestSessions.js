import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const SPOC_NAMES = [
  'João Silva', 'Maria Santos', 'Carlos Oliveira', 'Ana Costa', 'Pedro Ferreira',
  'Rita Gomes', 'Miguel Torres', 'Cátia Dias', 'Paulo Machado', 'Lurdes Sousa'
];

const COMMENTS = [
  'Sessão com crianças muito animadas',
  'Grupo de adolescentes interessado',
  'Família em férias',
  'Grupo corporativo de team building',
  'Turma de escola em visita',
  'Grupo de amigos',
  'Aniversário infantil',
  'Evento especial',
  'Reserva VIP',
  ''
];

const STATUSES = ['done', 'active', 'pending_payment', 'no_show', 'cancelled'];

export async function generateTestSessions(count = 70) {
  try {
    console.log(`🚀 Starting to create ${count} test sessions...`);

    const now = new Date();
    const sessionsRef = collection(db, 'sessions');

    for (let i = 0; i < count; i++) {
      const daysOffset = i - 30; // -30 to +39, covering both past and future
      const sessionDate = new Date(now);
      sessionDate.setDate(sessionDate.getDate() + daysOffset);

      // Random hour between 8 and 19 (8 AM to 7 PM)
      const hour = Math.floor(Math.random() * 12) + 8; // 8-19
      // Random 30-minute interval (0 or 30)
      const minute = Math.random() > 0.5 ? 30 : 0;

      sessionDate.setHours(hour, minute, 0, 0);

      const spoc = SPOC_NAMES[Math.floor(Math.random() * SPOC_NAMES.length)];
      const numberOfPlayers = Math.floor(Math.random() * 35) + 5; // 5 to 40 players
      const comment = COMMENTS[Math.floor(Math.random() * COMMENTS.length)];
      const status = STATUSES[Math.floor(Math.random() * STATUSES.length)];

      const y = sessionDate.getFullYear();
      const m = String(sessionDate.getMonth() + 1).padStart(2, '0');
      const d = String(sessionDate.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;
      const timeStr = `${String(hour).padStart(2, '0')}:${minute === 0 ? '00' : '30'}`;
      const sessionDatetime = `${dateStr}T${timeStr}`;

      await addDoc(sessionsRef, {
        spoc,
        numberOfPlayers,
        sessionDate: dateStr,
        sessionTime: timeStr,
        sessionDatetime,
        status,
        additionalComments: comment,
        monitors: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      if ((i + 1) % 10 === 0) {
        console.log(`✓ Created ${i + 1}/${count} sessions...`);
      }
    }

    console.log(`✅ Successfully created ${count} test sessions!`);
    return { success: true, count };
  } catch (error) {
    console.error('❌ Error creating sessions:', error);
    throw error;
  }
}

// Make it globally available for console access
if (typeof window !== 'undefined') {
  window.generateTestSessions = generateTestSessions;
}
