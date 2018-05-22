import firebase from 'firebase/app';
import { config } from '../secrets.user';

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(config);
}

export default firebase;