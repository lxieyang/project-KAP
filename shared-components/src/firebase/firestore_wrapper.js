import firebase from './firebase';

export let db = firebase.firestore();
export const getCurrentUserId = () => firebase.auth().currentUser.uid;
export const getCurrentUserCurrentTaskId = () => {
  return db
    .collection('users')
    .doc(getCurrentUserId())
    .collection('TaskManagement')
    .doc('currentTask');
};

/* functions */
export * from './wrappers/user_functions';
export * from './wrappers/task_functions';
export * from './wrappers/piece_functions';