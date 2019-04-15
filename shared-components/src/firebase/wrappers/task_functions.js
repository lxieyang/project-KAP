import firebase from '../firebase';
import {
  db,
  getCurrentUser,
  getCurrentUserId,
  getCurrentUserCurrentTaskId
} from '../firestore_wrapper';
import * as FirestoreManager from '../firestore_wrapper';
const uuid = require('uuid/v4');

export const getTaskById = taskId => {
  return db.collection('tasks').doc(taskId);
};

export const getTaskInstrumentV1DataById = taskId => {
  return getTaskById(taskId).collection('instrumentV1Data');
};

export const getAllCommentsToTask = taskId => {
  return getTaskById(taskId).collection('comments');
};

export const getCurrentUserCreatedTasks = () => {
  return db
    .collection('tasks')
    .where('creator', '==', getCurrentUserId())
    .where('trashed', '==', false);
};

export const updateCurrentUserCurrentTaskId = taskId => {
  if (taskId === null) {
    return getCurrentUserCurrentTaskId().delete();
  }
  return getCurrentUserCurrentTaskId().set(
    {
      id: taskId
    },
    { merge: true }
  );
};

export const updateTaskName = (taskId, newTaskName) => {
  FirestoreManager.Task__EditTaskName(taskId, newTaskName).then(() => {
    getTaskById(taskId)
      .update({
        name: newTaskName
      })
      .then(stuff => {
        updateTaskUpdateTime(taskId);
      });
  });
};

//
//
//
/* commenting */
export const addCommentToATaskById = (taskId, newCommentContent) => {
  getTaskById(taskId)
    .collection('comments')
    .add({
      content: newCommentContent,
      creationDate: firebase.firestore.FieldValue.serverTimestamp(),
      updateDate: firebase.firestore.FieldValue.serverTimestamp(),
      authorId: getCurrentUserId(),
      authorEmail: getCurrentUser().email,
      authorName: getCurrentUser().displayName,
      authorAvatarURL: getCurrentUser().photoURL
    })
    .then(docRef => {
      FirestoreManager.Task__AddCommentToTask(
        taskId,
        docRef.id,
        newCommentContent
      );

      getTaskById(taskId).update({
        updateDate: firebase.firestore.FieldValue.serverTimestamp()
      });
      updateTaskUpdateTime(taskId);
    });
};

export const updateCommentToATaskById = async (
  taskId,
  commentId,
  newCommentContent
) => {
  await FirestoreManager.Task__EditCommentToTask(
    taskId,
    commentId,
    newCommentContent
  );

  getTaskById(taskId)
    .collection('comments')
    .doc(commentId)
    .update({
      content: newCommentContent,
      authorName: getCurrentUser().displayName,
      authorAvatarURL: getCurrentUser().photoURL,
      updateDate: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
      getTaskById(taskId).update({
        updateDate: firebase.firestore.FieldValue.serverTimestamp()
      });
      updateTaskUpdateTime(taskId);
    });
};

export const deleteCommentToATaskById = async (taskId, commentId) => {
  await FirestoreManager.Task__DeleteCommentToTask(taskId, commentId);

  return getTaskById(taskId)
    .collection('comments')
    .doc(commentId)
    .delete()
    .then(() => {
      updateTaskUpdateTime(taskId);
    });
};

export const toggleTaskStarStatus = (taskId, to) => {
  FirestoreManager.Task__ToggleTaskStarStatus(taskId, to);

  getTaskById(taskId)
    .update({
      isStarred: to
    })
    .then(() => {
      updateTaskUpdateTime(taskId);
    });
};

export const deleteTaskById = taskId => {
  getTaskById(taskId)
    .update({
      trashed: true
    })
    .then(() => {
      FirestoreManager.Task__DeleteTask(taskId);

      // automatically switch to the last task that got updated
      getCurrentUserCreatedTasks()
        .orderBy('updateDate', 'desc')
        .limit(1)
        .get()
        .then(querySnapshot => {
          if (querySnapshot.empty) {
            updateCurrentUserCurrentTaskId(null);
          } else {
            updateCurrentUserCurrentTaskId(querySnapshot.docs[0].id);
          }
        });

      updateTaskUpdateTime(taskId);
    });
};

export const reviveTaskById = taskId => {
  getTaskById(taskId)
    .update({
      trashed: false
    })
    .then(() => {
      updateCurrentUserCurrentTaskId(taskId);
    });
};

export const updateTaskUpdateTime = taskId => {
  return getTaskById(taskId).update({
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
