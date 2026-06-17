import { storage } from './config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export const uploadProfilePicture = async (uid, file) => {
  const storageRef = ref(storage, `profile-pictures/${uid}`);
  const snapshot = await uploadBytes(storageRef, file);
  return await getDownloadURL(snapshot.ref);
};
