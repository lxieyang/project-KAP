import firebase from './firebase';
import { userPrefix, userName} from '../secrets.user';

export { userName }


/* database ref */
export let database = firebase.database();

/* database path ref */
export let sampleActionRef = database.ref(userPrefix + 'sampleAction');
export let sampleListRef = database.ref(userPrefix + 'sampleList');
export let isDisabledRef = database.ref(userPrefix).child('isDisabled');
export let tasksRef = database.ref(userPrefix).child('tasks');
export let currentTaskIdRef = database.ref(userPrefix).child('currentTaskId');






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