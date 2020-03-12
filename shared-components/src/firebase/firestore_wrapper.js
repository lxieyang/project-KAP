import firebase from './firebase';

export const DB_COLLECTIONS = {
  WORKSPACES: 'workspaces',
  SEARCH_QUERIES: 'search_queries',
  WEBPAGES: 'webpages',
  TASKS: 'tasks',
  SCREENSHOTS: 'screenshots',
  USERS: 'users',
  PIECES: 'pieces'
};

export let db = firebase.firestore();
export const getCurrentUser = () => firebase.auth().currentUser;
export const getCurrentUserId = () => {
  let currentUser = getCurrentUser();
  if (currentUser) {
    return currentUser.uid;
  } else {
    return null;
  }
};
export const getCurrentUserCurrentTaskId = () => {
  return db
    .collection('users')
    .doc(getCurrentUserId())
    .collection('TaskManagement')
    .doc('currentTask');
};

/* functions */
export * from './wrappers/user_functions';
export * from './wrappers/task_functions';
export * from './wrappers/piece_functions';
export * from './wrappers/table_functions';
export * from './wrappers/workspace_functions';
export * from './wrappers/misc_functions';
export * from './wrappers/query_functions';
export * from './wrappers/page_functions';
export * from './wrappers/context_functions';
