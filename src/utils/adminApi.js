import { auth } from '../firebase/config';

// POSTs to a serverless endpoint with the current user's ID token attached.
export const apiPost = async (path, payload = {}) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not signed in');
  const token = await user.getIdToken();

  const res = await fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.error || `Request failed (${res.status})`;
    const err = new Error(data.detail ? `${msg} — ${data.detail}` : msg);
    err.status = res.status;
    err.detail = data.detail || '';
    throw err;
  }
  return data;
};

// Admin-only user management (create/delete with full Auth + Firestore cleanup)
export const adminUsersApi = (action, payload = {}) =>
  apiPost('/api/admin-users', { action, ...payload });

// Admin-only: create an announcement and email the team, server-side
export const publishAnnouncement = (payload) =>
  apiPost('/api/publish-announcement', payload);
