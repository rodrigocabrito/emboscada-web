import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SDK);
  initializeApp({ credential: cert(serviceAccount) });
}

const adminAuth = getAuth();
const adminDb = getFirestore();

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.slice(7);

  try {
    // Verify caller's identity
    const decoded = await adminAuth.verifyIdToken(token);

    // Confirm caller is an admin
    const callerDoc = await adminDb.collection('users').doc(decoded.uid).get();
    if (!callerDoc.exists || callerDoc.data().role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { uid } = req.body;
    if (!uid || typeof uid !== 'string') {
      return res.status(400).json({ error: 'Missing uid' });
    }

    // Prevent self-deletion
    if (uid === decoded.uid) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    await adminDb.collection('users').doc(uid).delete();

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('delete-user error:', err);
    return res.status(500).json({ error: 'Failed to delete user' });
  }
}
