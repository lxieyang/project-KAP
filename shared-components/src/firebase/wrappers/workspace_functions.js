import firebase from '../firebase';
import { WORKSPACE_TYPES } from '../../shared/types';
import {
  db,
  createNewTable,
  deleteTableById,
  updateTaskUpdateTime
} from '../firestore_wrapper';

export const getAllWorkspacesInTask = taskId => {
  return db
    .collection('workspaces')
    .where('references.task', '==', taskId)
    .where('trashed', '==', false);
};

export const getWorkspaceById = workspaceId => {
  return db.collection('workspaces').doc(workspaceId);
};

export const createNewWorkspace = payload => {
  if (payload.type === WORKSPACE_TYPES.table) {
    createNewTable(payload);
  }
};

export const deleteWorkspaceById = (workspaceId, workspaceType) => {
  if (workspaceType === WORKSPACE_TYPES.table) {
    deleteTableById(workspaceId);
  }
};

export const updateWorkspaceName = async (workspaceId, newWorkspaceName) => {
  getWorkspaceById(workspaceId)
    .update({
      name: newWorkspaceName
    })
    .then(() => {
      // update task updated time
      getWorkspaceById(workspaceId)
        .get()
        .then(doc => {
          updateTaskUpdateTime(doc.data().references.task);
        });
    });
};
