import firebase from '../firebase';
import { ANNOTATION_TYPES, PIECE_TYPES } from '../../shared/types';
import { encode, decode } from '../utilities/firebase_encode_decode.js';
import {
  db,
  getCurrentUserId,
  getCurrentUserCurrentTaskId,
  updateTaskUpdateTime,
  updateCurrentTaskUpdateTime,
  getCurrentUser
} from '../firestore_wrapper';
const xssFilter = require('xssfilter');
const xss = new xssFilter({
  matchStyleTag: false
});

//
//
//
/* getters */
export const getAllPiecesInTask = taskId => {
  return db
    .collection('pieces')
    .where('references.task', '==', taskId)
    .where('trashed', '==', false);
};

export const getPieceById = pieceId => {
  return db.collection('pieces').doc(pieceId);
};

export const getScreenshotById = pieceId => {
  return db.collection('screenshots').doc(pieceId);
};

export const getAllCommentsToPiece = pieceId => {
  return db
    .collection('pieces')
    .doc(pieceId)
    .collection('comments');
};

//
//
//
export const updateTaskUpdateTimeUponPieceManipulation = pieceId => {
  getPieceById(pieceId)
    .get()
    .then(docRef => {
      updateTaskUpdateTime(docRef.data().references.task);
    })
    .catch(e => {
      console.log(e);
    });
};

//
//
//
/* remove/revive piece by id */
export const deletePieceById = pieceId => {
  // set 'trashed' to true
  getPieceById(pieceId)
    .update({
      trashed: true,
      updateDate: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
      getScreenshotById(pieceId).update({
        trashed: true
      });
      updateTaskUpdateTimeUponPieceManipulation(pieceId);
    });
};

export const revivePieceById = pieceId => {
  getPieceById(pieceId)
    .update({
      trashed: false,
      updateDate: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
      getScreenshotById(pieceId).update({
        trashed: false
      });
      updateTaskUpdateTimeUponPieceManipulation(pieceId);
    });
};

//
//
//
/* screenshot */
export const addScreenshotToPieceById = async (
  pieceId,
  imageDataUrl,
  { dimensions }
) => {
  updateCurrentTaskUpdateTime();
  return getScreenshotById(pieceId).set({
    creator: getCurrentUserId(),
    creationDate: firebase.firestore.FieldValue.serverTimestamp(),
    trashed: false,
    imageDataUrl,
    dimensions
  });
};

//
//
//
/* piece type */
export const switchPieceType = (pieceId, originalType, newType) => {
  if (originalType !== newType) {
    getPieceById(pieceId)
      .update({
        pieceType: newType
      })
      .then(() => {
        getPieceById(pieceId).update({
          updateDate: firebase.firestore.FieldValue.serverTimestamp()
        });
        updateTaskUpdateTimeUponPieceManipulation(pieceId);
      });
  }
};

//
//
//
/* piece name */
export const updatePieceName = (pieceId, newName) => {
  getPieceById(pieceId)
    .update({
      name: newName,
      updateDate: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
      updateTaskUpdateTimeUponPieceManipulation(pieceId);
    });
};

//
//
//
/* commenting */
export const addCommentToAPieceById = (pieceId, newCommentContent) => {
  getPieceById(pieceId)
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
      getPieceById(pieceId).update({
        updateDate: firebase.firestore.FieldValue.serverTimestamp()
      });
      updateTaskUpdateTimeUponPieceManipulation(pieceId);
    });
};

export const updateCommentById = (pieceId, commentId, newCommentContent) => {
  getPieceById(pieceId)
    .collection('comments')
    .doc(commentId)
    .update({
      content: newCommentContent,
      authorName: getCurrentUser().displayName,
      authorAvatarURL: getCurrentUser().photoURL,
      updateDate: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
      getPieceById(pieceId).update({
        updateDate: firebase.firestore.FieldValue.serverTimestamp()
      });
      updateTaskUpdateTimeUponPieceManipulation(pieceId);
    });
};

export const deleteCommentById = (pieceId, commentId) => {
  return getPieceById(pieceId)
    .collection('comments')
    .doc(commentId)
    .delete()
    .then(() => {
      updateTaskUpdateTimeUponPieceManipulation(pieceId);
    });
};

/* create a piece */
export const createPiece = async (
  data,
  { url, hostname, pathname, pageTitle, taskId, shouldUseScreenshot },
  annotationType,
  pieceType
) => {
  let currentUserId = getCurrentUserId();
  let currentTaskId = (await getCurrentUserCurrentTaskId().get()).data().id;
  data.key = data.key || db.collection('pieces').doc().id;
  let ref = db.collection('pieces').doc(data.key);

  // construct piece
  let piece = {
    creator: currentUserId,
    trashed: false,
    annotationType: annotationType,
    pieceType: pieceType || PIECE_TYPES.snippet,
    shouldUseScreenshot: shouldUseScreenshot,
    creationDate: firebase.firestore.FieldValue.serverTimestamp(),
    updateDate: firebase.firestore.FieldValue.serverTimestamp(),
    references: {
      url: url ? url : false,
      page: url ? encode(url) : false,
      hostname: hostname ? hostname : false,
      pathname: pathname ? pathname : false,
      pageTitle: pageTitle ? pageTitle : false,
      task: taskId ? taskId : currentTaskId
    }
  };

  switch (annotationType) {
    case ANNOTATION_TYPES.Highlight:
      piece.text = data.text.trim();
      piece.name = data.text.trim();
      piece.html = data.html;
      if (piece.html) piece.html = xss.filter(data.html) || null;
      piece.anchorCoordinates = data.anchorCoordinates || {};
      piece.initialDimensions = data.initialDimensions || {};
      piece.contextText = data.contextText || '';
      piece.contextHtml = piece.html;
      if (data.contextHtml)
        piece.contextHtml = xss.filter(data.contextHtml) || null;
      piece.selection = data.selection || {};
      break;
    case ANNOTATION_TYPES.Snippet:
      piece.text = data.text.trim() || '';
      piece.name = data.text.trim() || '';
      piece.html = data.html.map(html => xss.filter(html)) || null;
      piece.anchorCoordinates = data.anchorCoordinates || {};
      piece.initialDimensions = data.initialDimensions || {};
      piece.subTitle = data.subTitle || null;
      piece.paths = data.paths || [];
      break;
    default:
      return; //In this case, we don't recognize the type
  }

  updateTaskUpdateTime(piece.references.task);

  return ref.set(piece);
};
