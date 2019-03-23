import firebase from '../firebase';
import {
  ANNOTATION_TYPES,
  PIECE_TYPES,
  TIMESTAMP_TYPES
} from '../../shared/types';
import { encode, decode } from '../utilities/firebase_encode_decode.js';
import {
  db,
  getCurrentUserId,
  getCurrentUserCurrentTaskId,
  updateTaskUpdateTime,
  updateCurrentTaskUpdateTime,
  getCurrentUser,
  addActionTimestamps
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

export const getAllTrashedPiecesInTask = taskId => {
  return db
    .collection('pieces')
    .where('references.task', '==', taskId)
    .where('trashed', '==', true);
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
      getScreenshotById(pieceId)
        .update({
          trashed: true
        })
        .catch(e => {
          // no screenshot to update, but it's OK
        });
      updateTaskUpdateTimeUponPieceManipulation(pieceId);
    });
};

export const deletePieceForeverById = pieceId => {
  getPieceById(pieceId)
    .delete()
    .then(() => {
      getScreenshotById(pieceId)
        .delete()
        .catch(e => {
          // no screenshot to update, but it's OK
        });
    });
};

export const clearTrashedPiecesForeverByTaskId = async taskId => {
  let trashedPieces = await getAllTrashedPiecesInTask(taskId).get();
  // Get a new write batch
  let batch = db.batch();
  trashedPieces.forEach(snapshot => {
    batch.delete(snapshot.ref);
    batch.delete(getScreenshotById(snapshot.id));
  });

  // Commit the batch
  batch.commit().then(function() {
    // console.log('cleared');
  });
};

export const revivePieceById = pieceId => {
  getPieceById(pieceId)
    .update({
      trashed: false,
      updateDate: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
      getScreenshotById(pieceId)
        .update({
          trashed: false
        })
        .catch(e => {
          // no screenshot to update, but it's OK
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
  if (originalType === null || originalType !== newType) {
    getPieceById(pieceId)
      .update({
        pieceType: newType,
        updateDate: firebase.firestore.FieldValue.serverTimestamp()
      })
      .then(() => {
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
/* piece text */
export const updatePieceText = (pieceId, newText) => {
  getPieceById(pieceId)
    .update({
      text: newText,
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
  pieceType,
  timer = null
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
    shouldUseScreenshot: shouldUseScreenshot ? shouldUseScreenshot : false,
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
    case ANNOTATION_TYPES.Manual:
      // piece.text = data.text.trim();
      piece.name = data.text.trim();
      // piece.html = data.text.trim();
      piece.text = '';
      piece.html = '';
      break;
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

  return ref.set(piece).then(() => {
    if (timer !== null) {
      addActionTimestamps(piece.references.task, {
        ...timer,
        timestampType: TIMESTAMP_TYPES.annotation,
        annotationType
      });
    }
    return ref.id;
  });
};
