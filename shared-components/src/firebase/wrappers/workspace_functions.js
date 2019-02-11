import firebase from '../firebase';
import { WORKSPACE_TYPES } from '../../shared/types';
import { db, createNewTable } from '../firestore_wrapper';

export const createNewWorkspace = payload => {
  if (payload.type === WORKSPACE_TYPES.table) {
    createNewTable(payload);
  }
};

export const deleteWorkspaceById = workspaceId => {
  db.collection('workspaces')
    .doc(workspaceId)
    .delete();

  // db.collection('workspaces')
  //   .doc(workspaceId)
  //   .update({
  //     trashed: true
  //   });
};
