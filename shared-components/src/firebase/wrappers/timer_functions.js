import { db } from '../firestore_wrapper';

export const getTaskTimerDoc = taskId => {
  return db.collection('tasks_timer').doc(taskId);
};

export const getTaskActionTimestampLogCollection = taskId => {
  return getTaskTimerDoc(taskId).collection('actionTimestamps');
};

export const addActionTimestamps = (taskId, timestamp) => {
  getTaskActionTimestampLogCollection(taskId).add(timestamp);
};

export const setTaskStartTime = (taskId, time) => {
  getTaskTimerDoc(taskId).set(
    {
      startTimestamp: time
    },
    { merge: true }
  );
};

export const setTaskEndTime = (taskId, time) => {
  getTaskTimerDoc(taskId).set(
    {
      endTimestamp: time
    },
    { merge: true }
  );
};
