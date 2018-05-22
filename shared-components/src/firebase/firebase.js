import * as firebase from 'firebase';
import { config } from '../secrets.user';

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(config);
}

export default firebase;