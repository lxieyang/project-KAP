import firebase from '../firebase';
import {
  db,
  getCurrentUserId,
  getCurrentUserCurrentTaskId
} from '../firestore_wrapper';
const uuid = require('uuid/v4');

export const getCurrentUserCreatedTasks = () => {
  return db.collection('tasks').where('creator', '==', getCurrentUserId());
};

export const updateCurrentUserCurrentTaskId = taskId => {
  return getCurrentUserCurrentTaskId().set(
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
