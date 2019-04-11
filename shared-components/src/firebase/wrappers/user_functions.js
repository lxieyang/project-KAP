import { db, getCurrentUser, getCurrentUserId } from '../firestore_wrapper';

export const updateUserProfile = () => {
  let user = getCurrentUser();
  db.collection('users')
    .doc(getCurrentUserId())
    .set(
      {
        uid: user.uid,
        displayName: user.displayName,
        photoURL: user.photoURL,
        email: user.email,
        isAnonymous: user.isAnonymous,
        providerId: user.providerId
      },
      {
        merge: true
      }
    );
};

export const getUserProfileById = uid => {
  return db.collection('users').doc(uid);
};
