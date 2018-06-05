import firebase from './firebase';

export let defaultUserId = 'invalid';
export let defaultUserName = 'invalid';

window.firebase = firebase;

export let userId = defaultUserId;
export let userName = defaultUserName;
export let userProfilePhotoURL = null;
let userPrefix = 'users/' + userId;

export const setUserIdAndName = (
  newUserId = defaultUserId, 
  newUserName = defaultUserName, 
  newProfilePhotoURL = null
) => {
  userId = newUserId;
  userName = newUserName;
  userPrefix = 'users/' + userId;
  userProfilePhotoURL = newProfilePhotoURL;
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
export let lastTaskIdRef = database.ref(userPrefix).child('lastTaskId');
export let editorIntegrationRef = database.ref(userPrefix).child('editorSupport');
export let codebasesRef = database.ref('codebases');

const updatePaths = () => {
  sampleActionRef = database.ref(userPrefix + 'sampleAction');
  sampleListRef = database.ref(userPrefix + 'sampleList');
  isDisabledRef = database.ref(userPrefix).child('isDisabled');
  tasksRef = database.ref(userPrefix).child('tasks');
  currentTaskIdRef = database.ref(userPrefix).child('currentTaskId');
  lastTaskIdRef = database.ref(userPrefix).child('lastTaskId');
  editorIntegrationRef = database.ref(userPrefix).child('editorSupport');
}