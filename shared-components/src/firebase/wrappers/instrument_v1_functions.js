import firebase from '../firebase';

import {
  db,
  getCurrentUserId,
  getTaskById,
  getCurrentUserCurrentTaskId,
  getPieceById,
  getAllTrashedPiecesInTask,
  getScreenshotById,
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

export const Piece__CreateHighlightPiece = async (
  pieceId,
  highlightContent,
  url,
  originalHtml
) => {
  let currentTaskId = (await getCurrentUserCurrentTaskId().get()).data().id;
  let taskData = (await getTaskById(currentTaskId).get()).data();
  let record = {
    eventType: eventTypes.PIECE__CREATE_HIGHLIGHT_PIECE,
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    eventAuthorId: getCurrentUserId(),
    // event specific
    taskName: taskData.name,
    taskId: currentTaskId,
    pieceId: pieceId,
    text: highlightContent,
    url: url,
    html: originalHtml
  };
  if (record.html) record.html = xss.filter(originalHtml) || null;
  getTaskInstrumentV1DataById(currentTaskId).add(record);
};

export const Piece__CreateSnapshotPiece = async (
  pieceId,
  snapshotContent,
  url,
  originalHtml,
  screenshot = null,
  dimensions = null
) => {
  let currentTaskId = (await getCurrentUserCurrentTaskId().get()).data().id;
  let taskData = (await getTaskById(currentTaskId).get()).data();
  let record = {
    eventType: eventTypes.PIECE__CREATE_SNAPSHOT_PIECE,
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    eventAuthorId: getCurrentUserId(),
    // event specific
    taskName: taskData.name,
    taskId: currentTaskId,
    pieceId: pieceId,
    text: snapshotContent,
    url: url,
    html: originalHtml.map(html => xss.filter(html)) || null,
    screenshot: screenshot,
    dimensions: dimensions
  };
  getTaskInstrumentV1DataById(currentTaskId).add(record);
};

export const Piece__DeletePiece = async pieceId => {
  let pieceData = (await getPieceById(pieceId).get()).data();
  let taskId = pieceData.references.task;
  let taskData = (await getTaskById(taskId).get()).data();
  let record = {
    eventType: eventTypes.PIECE__DELETE_PIECE,
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    eventAuthorId: getCurrentUserId(),
    // event specific
    taskName: taskData.name,
    taskId: taskId,
    pieceId: pieceId,
    name: pieceData.name,
    text: pieceData.text,
    url: pieceData.references.url,
    html: pieceData.html
  };
  getTaskInstrumentV1DataById(taskId).add(record);
};

export const Piece__DeletePieceForever = async pieceId => {
  let pieceData = (await getPieceById(pieceId).get()).data();
  let taskId = pieceData.references.task;
  let taskData = (await getTaskById(taskId).get()).data();
  let record = {
    eventType: eventTypes.PIECE__DELETE_PIECE_FOREVER,
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    eventAuthorId: getCurrentUserId(),
    // event specific
    taskName: taskData.name,
    taskId: taskId,
    pieceId: pieceId,
    name: pieceData.name,
    text: pieceData.text,
    url: pieceData.references.url,
    html: pieceData.html
  };
  return getTaskInstrumentV1DataById(taskId).add(record);
};

export const Piece__EmptyTrashCan = async taskId => {
  let taskData = (await getTaskById(taskId).get()).data();
  let record = {
    eventType: eventTypes.PIECE__EMPTY_TRASH_CAN,
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    eventAuthorId: getCurrentUserId(),
    // event specific
    taskName: taskData.name,
    taskId: taskId
  };
  await getTaskInstrumentV1DataById(taskId).add(record);

  let trashedPieces = await getAllTrashedPiecesInTask(taskId).get();
  let promises = [];
  trashedPieces.forEach(snapshot => {
    promises.push(Piece__DeletePieceForever(snapshot.id));
  });

  return Promise.all(promises);
};

export const Piece__RevivePiece = async pieceId => {
  let pieceData = (await getPieceById(pieceId).get()).data();
  let taskId = pieceData.references.task;
  let taskData = (await getTaskById(taskId).get()).data();
  let record = {
    eventType: eventTypes.PIECE__REVIVE_PIECE,
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    eventAuthorId: getCurrentUserId(),
    // event specific
    taskName: taskData.name,
    taskId: taskId,
    pieceId: pieceId,
    name: pieceData.name,
    text: pieceData.text,
    url: pieceData.references.url,
    html: pieceData.html
  };
  getTaskInstrumentV1DataById(taskId).add(record);
};

export const Piece__EditPieceName = async (pieceId, newName) => {
  let pieceData = (await getPieceById(pieceId).get()).data();
  let taskId = pieceData.references.task;
  let taskData = (await getTaskById(taskId).get()).data();
  let record = {
    eventType: eventTypes.PIECE__EDIT_PIECE_NAME,
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    eventAuthorId: getCurrentUserId(),
    // event specific
    taskName: taskData.name,
    taskId: taskId,
    pieceId: pieceId,
    name: pieceData.name,
    newName: newName,
    text: pieceData.text,
    url: pieceData.references.url,
    html: pieceData.html
  };
  if (record.name !== newName)
    return getTaskInstrumentV1DataById(taskId).add(record);
  else return Promise.resolve();
};

export const Piece__EditPieceText = async (pieceId, newText) => {
  let pieceData = (await getPieceById(pieceId).get()).data();
  let taskId = pieceData.references.task;
  let taskData = (await getTaskById(taskId).get()).data();
  let record = {
    eventType: eventTypes.PIECE__EDIT_PIECE_TEXT,
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    eventAuthorId: getCurrentUserId(),
    // event specific
    taskName: taskData.name,
    taskId: taskId,
    pieceId: pieceId,
    name: pieceData.name,
    text: pieceData.text,
    newText: newText,
    url: pieceData.references.url,
    html: pieceData.html
  };
  if (record.text !== newText)
    return getTaskInstrumentV1DataById(taskId).add(record);
  else return Promise.resolve();
};

export const Piece__AddCommentToPiece = async (
  pieceId,
  commentId,
  newCommentContent
) => {
  let pieceData = (await getPieceById(pieceId).get()).data();
  let taskId = pieceData.references.task;
  let taskData = (await getTaskById(taskId).get()).data();
  let record = {
    eventType: eventTypes.PIECE__ADD_COMMENT_TO_PIECE,
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    eventAuthorId: getCurrentUserId(),
    // event specific
    taskName: taskData.name,
    taskId: taskId,
    pieceId: pieceId,
    name: pieceData.name,
    text: pieceData.text,
    url: pieceData.references.url,
    html: pieceData.html,
    commentId: commentId,
    commentContent: newCommentContent
  };
  getTaskInstrumentV1DataById(taskId).add(record);
};

export const Piece__EditCommentToPiece = async (
  pieceId,
  commentId,
  newCommentContent
) => {
  let pieceData = (await getPieceById(pieceId).get()).data();
  let commentData = (await getPieceById(pieceId)
    .collection('comments')
    .doc(commentId)
    .get()).data();
  let taskId = pieceData.references.task;
  let taskData = (await getTaskById(taskId).get()).data();
  let record = {
    eventType: eventTypes.PIECE__EDIT_COMMENT_TO_PIECE,
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    eventAuthorId: getCurrentUserId(),
    // event specific
    taskName: taskData.name,
    taskId: taskId,
    pieceId: pieceId,
    name: pieceData.name,
    text: pieceData.text,
    url: pieceData.references.url,
    html: pieceData.html,
    commentId: commentId,
    commentContent: commentData.content,
    newCommentContent: newCommentContent
  };
  return getTaskInstrumentV1DataById(taskId).add(record);
};

export const Piece__DeleteCommentToPiece = async (pieceId, commentId) => {
  let pieceData = (await getPieceById(pieceId).get()).data();
  let commentData = (await getPieceById(pieceId)
    .collection('comments')
    .doc(commentId)
    .get()).data();
  let taskId = pieceData.references.task;
  let taskData = (await getTaskById(taskId).get()).data();
  let record = {
    eventType: eventTypes.PIECE__DELETE_COMMENT_TO_PIECE,
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    eventAuthorId: getCurrentUserId(),
    // event specific
    taskName: taskData.name,
    taskId: taskId,
    pieceId: pieceId,
    name: pieceData.name,
    text: pieceData.text,
    url: pieceData.references.url,
    html: pieceData.html,
    commentId: commentId,
    commentContent: commentData.content
  };
  return getTaskInstrumentV1DataById(taskId).add(record);
};

/**
 *
 * Table Tracking
 *
 */
