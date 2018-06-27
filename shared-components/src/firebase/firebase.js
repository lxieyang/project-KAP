import firebase from 'firebase/app';
import 'firebase/database';
import 'firebase/firestore';
import 'firebase/auth';
import { config } from '../secrets.user';

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(config);
}

export default firebase;