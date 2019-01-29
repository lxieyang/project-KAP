import firebase from './firebase';

export let db = firebase.firestore();
export const getCurrentUserId = () => firebase.auth().currentUser.uid;

/* functions */
export * from './wrappers/user_functions';
export * from './wrappers/task_functions';
export * from './wrappers/piece_functions';
