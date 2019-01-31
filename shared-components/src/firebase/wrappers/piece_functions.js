import firebase from '../firebase';
import { ANNOTATION_TYPES, PIECE_TYPES } from '../../shared/types';
import { encode, decode } from '../utilities/firebase_encode_decode.js';
import {
  db,
  getCurrentUserId,
  getCurrentUserCurrentTaskId
} from '../firestore_wrapper';
const xssFilter = require('xssfilter');
const xss = new xssFilter({
  matchStyleTag: false
});

export const createPiece = async (
  data,
  { url, taskId },
  annotationType,
  pieceType
) => {
  let currentUserId = getCurrentUserId();
  let currentTaskId = (await getCurrentUserCurrentTaskId().get()).data().id;
  data.key = data.key || db.collection('notes').doc().id;
  let ref = db.collection('pieces').doc(data.key);

  // construct piece
  let piece = {
    creator: currentUserId,
    trashed: false,
    annotationType: annotationType,
    pieceType: pieceType || PIECE_TYPES.snippet,
    creationDate: firebase.firestore.FieldValue.serverTimestamp(),
    updateDate: firebase.firestore.FieldValue.serverTimestamp(),
    references: {
      url: url ? url : false,
      page: url ? encode(url) : false,
      task: taskId ? taskId : currentTaskId
    }
  };

  switch (annotationType) {
    case ANNOTATION_TYPES.Highlight:
      piece.text = data.text.trim();
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
      piece.html = data.html.map(html => xss.filter(html)) || null;
      piece.anchorCoordinates = data.anchorCoordinates || {};
      piece.initialDimensions = data.initialDimensions || {};
      piece.subTitle = data.subTitle || null;
      piece.paths = data.paths || [];
      break;
    default:
      return; //In this case, we don't recognize the type
  }

  return ref.set(piece);
};
