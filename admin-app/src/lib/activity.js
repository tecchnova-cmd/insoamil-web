import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export async function logActivity({ uid, accion, modulo, docId = null, detalle = null }) {
  try {
    await addDoc(collection(db, 'activityLogs'), {
      uid,
      accion,
      modulo,
      docId,
      detalle,
      fecha: serverTimestamp(),
    });
  } catch {
    // Activity logging is best-effort — never block the real action on it.
  }
}
