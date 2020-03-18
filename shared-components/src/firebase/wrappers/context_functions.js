import firebase from '../firebase';
import {
  ANNOTATION_TYPES,
  PIECE_TYPES,
  TIMESTAMP_TYPES
} from '../../shared/types';
import {
  db,
  getCurrentUserId,
  getCurrentUserCurrentTaskId,
  updateTaskUpdateTime,
  updateCurrentTaskUpdateTime,
  getCurrentUser
} from '../firestore_wrapper';

export const getAllContextObjectsInTask = taskId => {
  return db
    .collection('context_objects')
    .where('references.task', '==', taskId)
    .where('trashed', '==', false);
};

export const getAllContextObjects = () => {
  return db.collection('context_objects');
};

export const deleteContextObjectsByPieceId = pieceId => {
  return getAllContextObjects()
    .where('references.pieceId', '==', pieceId)
    .get()
    .then(querySnapshot => {
      querySnapshot.forEach(snapshot => {
        snapshot.ref.delete();
      });
    });
};

export const createContextObject = async ({
  url,
  type,
  pieceId,
  contextHTML
}) => {
  let currentUserId = getCurrentUserId();
  let currentTaskId = (await getCurrentUserCurrentTaskId().get()).data().id;
  let key = db.collection('context_objects').doc().id;
  let ref = db.collection('context_objects').doc(key);

  let context = {
    creator: currentUserId,
    trashed: false,
    creationDate: firebase.firestore.FieldValue.serverTimestamp(),
    updateDate: firebase.firestore.FieldValue.serverTimestamp(),
    contextHTML,
    references: {
      url: url ? url : false,
      type: type,
      pieceId: pieceId ? pieceId : false,
      task: currentTaskId
    }
  };

  return ref.set(context).then(() => {
    return ref.id;
  });
};
