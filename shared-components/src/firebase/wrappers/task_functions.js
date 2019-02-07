import firebase from '../firebase';
import {
  db,
  getCurrentUserId,
  getCurrentUserCurrentTaskId
} from '../firestore_wrapper';
const uuid = require('uuid/v4');

export const getCurrentUserCreatedTasks = () => {
  return db
    .collection('tasks')
    .where('creator', '==', getCurrentUserId())
    .where('trashed', '==', false);
};

export const updateCurrentUserCurrentTaskId = taskId => {
  return getCurrentUserCurrentTaskId().set(
    {
      id: taskId
    },
    { merge: true }
  );
};

export const updateTaskName = (taskId, newTaskName) => {
  db.collection('tasks')
    .doc(taskId)
    .update({
      name: newTaskName
    })
    .then(() => {
      updateTaskUpdateTime(taskId);
    });
};

export const toggleTaskStarStatus = (taskId, to) => {
  db.collection('tasks')
    .doc(taskId)
    .update({
      isStarred: to
    })
    .then(() => {
      updateTaskUpdateTime(taskId);
    });
};

export const deleteTaskById = taskId => {
  db.collection('tasks')
    .doc(taskId)
    .update({
      trashed: true
    })
    .then(() => {
      // automatically switch to the last task that got updated
      getCurrentUserCreatedTasks()
        .orderBy('updateDate', 'desc')
        .limit(1)
        .get()
        .then(querySnapshot => {
          updateCurrentUserCurrentTaskId(querySnapshot.docs[0].id);
        });

      updateTaskUpdateTime(taskId);
    });
};

export const reviveTaskById = taskId => {
  db.collection('tasks')
    .doc(taskId)
    .update({
      trashed: false
    })
    .then(() => {
      updateCurrentUserCurrentTaskId(taskId);
    });
};

export const updateTaskUpdateTime = taskId => {
  return db
    .collection('tasks')
    .doc(taskId)
    .update({
      updateDate: firebase.firestore.FieldValue.serverTimestamp()
    });
};

export const updateCurrentTaskUpdateTime = async () => {
  let currentTaskId = (await getCurrentUserCurrentTaskId().get()).data().id;
  return updateTaskUpdateTime(currentTaskId);
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
    trashed: false,
    creationDate: firebase.firestore.FieldValue.serverTimestamp(),
    updateDate: firebase.firestore.FieldValue.serverTimestamp(),
    isStarred: false,
    shareId: uuid(),
    readOnlyId: uuid()
  });
};
