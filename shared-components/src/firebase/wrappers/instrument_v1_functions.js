import firebase from '../firebase';

import {
  db,
  getCurrentUserId,
  getTaskById,
  getCurrentUserCurrentTaskId,
  getTaskInstrumentV1DataById
} from '../firestore_wrapper';
import eventTypes from './instrument_v1_event_types';
const xssFilter = require('xssfilter');
const xss = new xssFilter({
  matchStyleTag: false
});

/**
 *
 * Task Tracking
 *
 */
export const Task__CreateTask = async taskId => {
  let taskData = (await getTaskById(taskId).get()).data();
  let record = {
    eventType: eventTypes.TASK__CREATE_TASK,
    timestamp: taskData.creationDate,
    eventAuthorId: taskData.creator,
    // event specific
    taskName: taskData.name,
    taskId: taskId
  };
  getTaskInstrumentV1DataById(taskId).add(record);
};

export const Task__DeleteTask = async taskId => {
  let taskData = (await getTaskById(taskId).get()).data();
  let record = {
    eventType: eventTypes.TASK__DELETE_TASK,
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    eventAuthorId: getCurrentUserId(),
    // event specific
    taskName: taskData.name,
    taskId: taskId
  };
  getTaskInstrumentV1DataById(taskId).add(record);
};

export const Task__EditTaskName = async (taskId, newTaskName) => {
  let taskData = (await getTaskById(taskId).get()).data();
  let record = {
    eventType: eventTypes.TASK__EDIT_TASK_NAME,
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    eventAuthorId: getCurrentUserId(),
    // event specific
    taskName: taskData.name,
    newTaskName: newTaskName,
    taskId: taskId
  };
  return getTaskInstrumentV1DataById(taskId).add(record);
};

export const Task__ToggleTaskStarStatus = async (taskId, to) => {
  let taskData = (await getTaskById(taskId).get()).data();
  let record = {
    eventType: eventTypes.TASK__TOGGLE_TASK_STAR_STATUS,
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    eventAuthorId: getCurrentUserId(),
    // event specific
    taskName: taskData.name,
    taskId: taskId,
    from: !to,
    to: to
  };
  getTaskInstrumentV1DataById(taskId).add(record);
};

export const Task__AddCommentToTask = async (
  taskId,
  commentId,
  newCommentContent
) => {
  let taskData = (await getTaskById(taskId).get()).data();
  let record = {
    eventType: eventTypes.TASK__ADD_COMMENT_TO_TASK,
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    eventAuthorId: getCurrentUserId(),
    // event specific
    taskName: taskData.name,
    taskId: taskId,
    commentId: commentId,
    commentContent: newCommentContent
  };
  getTaskInstrumentV1DataById(taskId).add(record);
};

export const Task__EditCommentToTask = async (
  taskId,
  commentId,
  newCommentContent
) => {
  let commentData = (await getTaskById(taskId)
    .collection('comments')
    .doc(commentId)
    .get()).data();
  let taskData = (await getTaskById(taskId).get()).data();
  let record = {
    eventType: eventTypes.TASK__EDIT_COMMENT_TO_TASK,
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    eventAuthorId: getCurrentUserId(),
    // event specific
    taskName: taskData.name,
    taskId: taskId,
    commentId: commentId,
    commentContent: commentData.content,
    newCommentContent: newCommentContent
  };
  return getTaskInstrumentV1DataById(taskId).add(record);
};

export const Task__DeleteCommentToTask = async (taskId, commentId) => {
  let commentData = (await getTaskById(taskId)
    .collection('comments')
    .doc(commentId)
    .get()).data();
  let taskData = (await getTaskById(taskId).get()).data();
  let record = {
    eventType: eventTypes.TASK__DELETE_COMMENT_TO_TASK,
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    eventAuthorId: getCurrentUserId(),
    // event specific
    taskName: taskData.name,
    taskId: taskId,
    commentId: commentId,
    commentContent: commentData.content
  };
  return getTaskInstrumentV1DataById(taskId).add(record);
};

/**
 *
 * Piece Tracking
 *
 */

export const Piece__HightlightContent = async (
  highlightContent,
  url,
  originalHtml
) => {
  let currentTaskId = (await getCurrentUserCurrentTaskId().get()).data().id;
  let taskData = (await getTaskById(currentTaskId).get()).data();
  let record = {
    eventType: eventTypes.PIECE__HIGHLIGHT_CONTENT,
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    eventAuthorId: getCurrentUserId(),
    // event specific
    taskName: taskData.name,
    taskId: currentTaskId,
    text: highlightContent,
    url: url,
    html: originalHtml
  };
  if (record.html) record.html = xss.filter(originalHtml) || null;
  if (record.text.trim() !== '')
    getTaskInstrumentV1DataById(currentTaskId).add(record);
};

export const Piece__SnapshotContent = async (
  snapshotContent,
  url,
  originalHtml,
  screenshot = null,
  dimensions = null
) => {
  let currentTaskId = (await getCurrentUserCurrentTaskId().get()).data().id;
  let taskData = (await getTaskById(currentTaskId).get()).data();
  let record = {
    eventType: eventTypes.PIECE__SNAPSHOT_CONTENT,
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    eventAuthorId: getCurrentUserId(),
    // event specific
    taskName: taskData.name,
    taskId: currentTaskId,
    text: snapshotContent,
    url: url,
    html: originalHtml.map(html => xss.filter(html)) || null,
    screenshot: screenshot,
    dimensions: dimensions
  };
  getTaskInstrumentV1DataById(currentTaskId).add(record);
};

/**
 *
 * Table Tracking
 *
 */
