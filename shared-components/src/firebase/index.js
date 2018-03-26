import firebase from './firebase';
import { userPrefix, userName} from '../secrets.user';

export { userName }


/* database ref */
export let database = firebase.database();

/* database path ref */
export let sampleActionRef = database.ref(userPrefix + 'sampleAction');
export let sampleListRef = database.ref(userPrefix + 'sampleList');
export let isDisabledRef = database.ref(userPrefix + 'isDisabled');
export let tasksRef = database.ref(userPrefix + 'tasks');
export let currentTaskIdRef = database.ref(userPrefix + 'currentTaskId');