import firebase from './firebase';

export let defaultUserId = 'invalid';
export let defaultUserName = 'invalid';

export let firestoreCollections = {
  USERS: 'users'
};

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

/* database & firestore ref */
export let database = firebase.database();
export let firestore = firebase.firestore();
const settings = {timestampsInSnapshots: true};
firestore.settings(settings);

/* database & firestore path ref */
export let isDisabledRef = database.ref(userPrefix).child('isDisabled');
export let tasksRef = database.ref(userPrefix).child('tasks');
export let currentTaskIdRef = database.ref(userPrefix).child('currentTaskId');
export let lastTaskIdRef = database.ref(userPrefix).child('lastTaskId');
export let editorIntegrationRef = database.ref(userPrefix).child('editorSupport');
export let codebasesRef = database.ref('codebases');
/* ----- */
export let userPathInFirestore = firestore.collection(firestoreCollections.USERS).doc(userId);

const updatePaths = () => {
  isDisabledRef = database.ref(userPrefix).child('isDisabled');
  tasksRef = database.ref(userPrefix).child('tasks');
  currentTaskIdRef = database.ref(userPrefix).child('currentTaskId');
  lastTaskIdRef = database.ref(userPrefix).child('lastTaskId');
  editorIntegrationRef = database.ref(userPrefix).child('editorSupport');
  /* ----- */
  userPathInFirestore = firestore.collection(firestoreCollections.USERS).doc(userId);
}