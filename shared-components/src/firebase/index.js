import firebase from './firebase';
import { defaultUserId, defaultUserName} from '../secrets.user';

export let userId = defaultUserId;
export let userName = defaultUserName;
let userPrefix = 'users/' + userId;

export const setUserIdAndName = (newUserId, newUserName) => {
  userId = newUserId;
  userName = newUserName;
  userPrefix = 'users/' + userId;
  updatePaths();
}

/* database ref */
export let database = firebase.database();

/* database path ref */
export let sampleActionRef = database.ref(userPrefix + 'sampleAction');
export let sampleListRef = database.ref(userPrefix + 'sampleList');
export let isDisabledRef = database.ref(userPrefix).child('isDisabled');
export let tasksRef = database.ref(userPrefix).child('tasks');
export let currentTaskIdRef = database.ref(userPrefix).child('currentTaskId');
export let editorIntegrationRef = database.ref(userPrefix).child('editorSupport');

const updatePaths = () => {
  sampleActionRef = database.ref(userPrefix + 'sampleAction');
  sampleListRef = database.ref(userPrefix + 'sampleList');
  isDisabledRef = database.ref(userPrefix).child('isDisabled');
  tasksRef = database.ref(userPrefix).child('tasks');
  currentTaskIdRef = database.ref(userPrefix).child('currentTaskId');
  editorIntegrationRef = database.ref(userPrefix).child('editorSupport');
}






// /* some automatic bookkeeping */
// tasksRef.on('child_added', (snapshot) => {
//   console.log(snapshot.key);
//   currentTaskIdRef.set(snapshot.key);
// });

// tasksRef.on('child_removed', () => {
//   tasksRef.once('value', (snapshot) => {
//     snapshot.forEach((littleSnapshot) => {
//       console.log(littleSnapshot.ley);
//       currentTaskIdRef.set(littleSnapshot.key);
//     });
//   });
// });