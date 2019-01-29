import firebase from '../firebase';
import { db, getCurrentUserId } from '../firestore_wrapper';
const uuid = require('uuid/v4');

export const getCurrentUserCreatedTasks = () => {
  return db.collection('tasks').where('creator', '==', getCurrentUserId());
};

export const getCurrentUserCurrentTaskId = () => {
  return db
    .collection('users')
    .doc(getCurrentUserId())
    .collection('TaskManagement')
    .doc('currentTask');
};

export const updateCurrentUserCurrentTaskId = taskId => {
  return db
    .collection('users')
    .doc(getCurrentUserId())
    .collection('TaskManagement')
    .doc('currentTask')
    .set(
      {
        id: taskId
      },
      { merge: true }
    );
};

export const createTaskWithName = newTaskName => {
  let currentUserId = getCurrentUserId();
  let users = {};
  users[currentUserId] = {
    lastAccess: firebase.firestore.FieldValue.serverTimestamp(),
    lastUpdate: firebase.firestore.FieldValue.serverTimestamp(),
    contributor: true
  };
  return db.collection('tasks').add({
    name: newTaskName,
    users,
    creator: currentUserId,
    creationDate: firebase.firestore.FieldValue.serverTimestamp(),
    updateDate: firebase.firestore.FieldValue.serverTimestamp(),
    isStarred: false,
    shareId: uuid(),
    readOnlyId: uuid()
  });
};
