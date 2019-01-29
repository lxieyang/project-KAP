import firebase from './firebase';

export let db = firebase.firestore();
export * from './wrappers/user_functions';
export * from './wrappers/task_functions';
