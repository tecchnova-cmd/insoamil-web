import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { app } from '../firebase';

// Creating a user with the Firebase Auth JS SDK signs the CURRENT browser in
// as that new user — a well-known limitation. To let a superadmin create
// another account without being kicked out of their own session, do the
// creation on a throwaway secondary App/Auth instance, then discard it.
export async function createUserWithoutSignIn(email, password) {
  const secondary = initializeApp(app.options, 'secondary-' + Date.now());
  const secondaryAuth = getAuth(secondary);
  try {
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    const uid = cred.user.uid;
    await signOut(secondaryAuth);
    return uid;
  } finally {
    await deleteApp(secondary);
  }
}
