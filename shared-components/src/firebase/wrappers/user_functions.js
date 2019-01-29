import firebase from '../firebase';

export const getCurrentUserId = () => firebase.auth().currentUser.uid;
