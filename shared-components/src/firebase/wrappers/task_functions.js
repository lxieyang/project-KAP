import firebase from '../firebase';
import {
  db,
  getCurrentUser,
  getCurrentUserId,
  getCurrentUserCurrentTaskId
} from '../firestore_wrapper';
const uuid = require('uuid/v4');

export const getTaskById = taskId => {
  return db.collection('tasks').doc(taskId);
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
  getTaskById(taskId)
    .update({ name: newTaskName })
    .then(() => {
      updateTaskUpdateTime(taskId);
    });
};

export const updateTaskGoal = (taskId, newTaskGoal) => {
  getTaskById(taskId)
    .update({ goal: newTaskGoal })
    .then(() => {
      updateTaskUpdateTime(taskId);
    });
};

export const getTaskEnvironmentsAndConstraints = taskId => {
  return getTaskById(taskId).collection('envAndConstraints');
};

export const addTaskEnvironment = async (taskId, newEnvrionment) => {
  const { name, url, suggested } = newEnvrionment;
  getTaskById(taskId)
    .collection('envAndConstraints')
    .add({
      name,
      suggested: suggested ? suggested : false,
      type: 'environment',
      references: {
        url: url ? url : false
      },
      creationDate: firebase.firestore.FieldValue.serverTimestamp(),
      updateDate: firebase.firestore.FieldValue.serverTimestamp(),
      authorId: getCurrentUserId()
    })
    .then(() => {
      updateTaskUpdateTime(taskId);
    });
};

export const removeTaskEnvrionmentOrConstraint = async (taskId, envId) => {
  getTaskById(taskId)
    .collection('envAndConstraints')
    .doc(envId)
    .delete();
};

export const addTaskConstraint = async (taskId, newConstraint) => {
  const { name } = newConstraint;
  getTaskById(taskId)
    .collection('envAndConstraints')
    .add({
      name,
      type: 'constraint',
      creationDate: firebase.firestore.FieldValue.serverTimestamp(),
      updateDate: firebase.firestore.FieldValue.serverTimestamp(),
      authorId: getCurrentUserId()
    })
    .then(() => {
      updateTaskUpdateTime(taskId);
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
      authorName: getCurrentUser().displayName,
      authorAvatarURL: getCurrentUser().photoURL
    })
    .then(() => {
      updateTaskUpdateTime(taskId);
    });
};

export const updateCommentToATaskById = (
  taskId,
  commentId,
  newCommentContent
) => {
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
      updateTaskUpdateTime(taskId);
    });
};

export const deleteCommentToATaskById = (taskId, commentId) => {
  return getTaskById(taskId)
    .collection('comments')
    .doc(commentId)
    .delete()
    .then(() => {
      updateTaskUpdateTime(taskId);
    });
};

export const toggleTaskStarStatus = (taskId, to) => {
  getTaskById(taskId)
    .update({ isStarred: to })
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
    readOnlyId: uuid(),
    goal: null
  });
};
