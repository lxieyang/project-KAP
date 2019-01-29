import firebase from 'firebase/app';
import 'firebase/database';
import 'firebase/firestore';
import 'firebase/auth';
import { config } from '../secrets.user';

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(config);
}

// Initialize Cloud Firestore through Firebase
let db = firebase.firestore();

// Disable deprecated features
db.settings({
  timestampsInSnapshots: true
});

export default firebase;
