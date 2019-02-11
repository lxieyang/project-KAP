import firebase from '../firebase';
import { WORKSPACE_TYPES, TABLE_CELL_TYPES } from '../../shared/types';
import {
  db,
  getCurrentUserId,
  getCurrentUserCurrentTaskId,
  updateTaskUpdateTime,
  updateCurrentTaskUpdateTime,
  getCurrentUser
} from '../firestore_wrapper';
import moment from 'moment';

export const getAllWorkspacesInTask = taskId => {
  return db
    .collection('workspaces')
    .where('references.task', '==', taskId)
    .where('trashed', '==', false);
};

export const createNewTableCell = async (
  tableId,
  tableCellType = TABLE_CELL_TYPES.regularCell
) => {
  let ref = db
    .collection('workspaces')
    .doc(tableId)
    .collection('cells')
    .doc();
  await ref.set({
    type: tableCellType
  });
  return ref.id;
};

export const createNewTable = async ({ name, creatorId, taskId }) => {
  let currentUserId = getCurrentUserId();
  let currentTaskId = (await getCurrentUserCurrentTaskId().get()).data().id;
  let workspaceType = WORKSPACE_TYPES.table;
  let ref = db.collection('workspaces').doc(); // create new table

  // construct table with one cell: topLeft
  let numRows = 1,
    numCols = 1;
  let tableRows = [];
  for (let i = 0; i < numRows; i++) {
    let row = [];
    for (let j = 0; j < numCols; j++) {
      let cell;
      if (i === 0 && j === 0) {
        // top left
        cell = await createNewTableCell(ref.id, TABLE_CELL_TYPES.topLeft);
      } else if (i === 0 && j > 0) {
        // column header
        cell = await createNewTableCell(ref.id, TABLE_CELL_TYPES.columnHeader);
      } else if (i > 0 && j === 0) {
        // row header
        cell = await createNewTableCell(ref.id, TABLE_CELL_TYPES.rowHeader);
      } else if (i > 0 && j > 0) {
        // regular cell
        cell = await createNewTableCell(ref.id, TABLE_CELL_TYPES.regularCell);
      }
      row.push(cell);
    }
    tableRows.push({ data: row }); // https://stackoverflow.com/questions/46593953/nested-arrays-are-not-supported
  }

  let table = {
    name:
      name !== '' && name !== null && name !== undefined
        ? name
        : `Table (created on ${moment(new Date()).format('LLL')})`,
    creator: creatorId || currentUserId,
    trashed: false,
    workspaceType,
    creationDate: firebase.firestore.FieldValue.serverTimestamp(),
    updateDate: firebase.firestore.FieldValue.serverTimestamp(),
    references: {
      task: taskId || currentTaskId
    },
    data: tableRows
  };

  await ref.set(table);
  return ref.id;
};
