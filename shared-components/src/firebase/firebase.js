import firebase from 'firebase/app';
import { config } from '../secrets.user';
require('firebase/database');
require('firebase/firestore');
require('firebase/auth');

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(config);
}

export default firebase;
