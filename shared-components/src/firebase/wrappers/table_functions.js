import firebase from '../firebase';
import { WORKSPACE_TYPES, TABLE_CELL_TYPES } from '../../shared/types';
import {
  db,
  getCurrentUserId,
  getCurrentUserCurrentTaskId,
  updateTaskUpdateTime,
  updateCurrentTaskUpdateTime,
  getCurrentUser,
  getWorkspaceById
} from '../firestore_wrapper';
import moment from 'moment';

export const getAllTableCellsInTableById = tableId => {
  return getWorkspaceById(tableId).collection('cells');
};

export const getTableCellById = (tableId, cellId) => {
  return getAllTableCellsInTableById(tableId).doc(cellId);
};

export const createNewTableCell = (
  tableId,
  tableCellType = TABLE_CELL_TYPES.regularCell
) => {
  let ref = db
    .collection('workspaces')
    .doc(tableId)
    .collection('cells')
    .doc();
  ref.set({
    type: tableCellType
  });
  return ref.id;
};

export const deleteTableCellById = (tableId, cellId) => {
  getTableCellById(tableId, cellId).delete();
};

export const createNewRowInTable = async tableId => {
  let tableRows = (await getWorkspaceById(tableId).get()).data().data;

  let numCols = tableRows[0].data.length;
  let row = [];
  for (let i = 0; i < numCols; i++) {
    let cell;
    if (i === 0) {
      cell = createNewTableCell(tableId, TABLE_CELL_TYPES.rowHeader);
    } else if (i > 0) {
      cell = createNewTableCell(tableId, TABLE_CELL_TYPES.regularCell);
    }
    row.push(cell);
  }
  tableRows.push({ data: row });
  updateTableData(tableId, tableRows);
};

export const deleteRowInTableByIndex = async (tableId, toDeleteRowIdx) => {
  let tableRows = (await getWorkspaceById(tableId).get()).data().data;

  let toDeleteCellIds = [...tableRows[toDeleteRowIdx].data];
  tableRows.splice(toDeleteRowIdx, 1);
  updateTableData(tableId, tableRows).then(() => {
    // then delete the actual cells in the "cells" collection
    toDeleteCellIds.forEach(cellId => {
      deleteTableCellById(tableId, cellId);
    });
  });
};

export const deleteColumnInTableByIndex = async (
  tableId,
  toDeleteColumnIdx
) => {
  let tableRows = (await getWorkspaceById(tableId).get()).data().data;

  let toDeleteCellIds = [];
  for (let i = 0; i < tableRows.length; i++) {
    toDeleteCellIds.push(tableRows[i].data[toDeleteColumnIdx]);
    tableRows[i].data.splice(toDeleteColumnIdx, 1);
  }
  updateTableData(tableId, tableRows).then(() => {
    // then delete the actual cells in the "cells" collection
    toDeleteCellIds.forEach(cellId => {
      deleteTableCellById(tableId, cellId);
    });
  });
};

export const createNewColumnInTable = async tableId => {
  let tableRows = (await db
    .collection('workspaces')
    .doc(tableId)
    .get()).data().data;

  let numRows = tableRows.length;
  for (let i = 0; i < numRows; i++) {
    let cell;
    if (i === 0) {
      cell = createNewTableCell(tableId, TABLE_CELL_TYPES.columnHeader);
    } else if (i > 0) {
      cell = createNewTableCell(tableId, TABLE_CELL_TYPES.regularCell);
    }
    tableRows[i].data.push(cell);
  }
  updateTableData(tableId, tableRows);
};

export const updateTableData = (tableId, tableRows) => {
  return db
    .collection('workspaces')
    .doc(tableId)
    .update({
      data: tableRows
    });
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
        cell = createNewTableCell(ref.id, TABLE_CELL_TYPES.topLeft);
      } else if (i === 0 && j > 0) {
        // column header
        cell = createNewTableCell(ref.id, TABLE_CELL_TYPES.columnHeader);
      } else if (i > 0 && j === 0) {
        // row header
        cell = createNewTableCell(ref.id, TABLE_CELL_TYPES.rowHeader);
      } else if (i > 0 && j > 0) {
        // regular cell
        cell = createNewTableCell(ref.id, TABLE_CELL_TYPES.regularCell);
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

export const deleteTableById = async tableId => {
  getWorkspaceById(tableId).delete();
  let querySnapshot = await getAllTableCellsInTableById(tableId).get();
  for (let i = 0; i < querySnapshot.docs.length; i++) {
    getAllTableCellsInTableById(tableId)
      .doc(querySnapshot.docs[i].id)
      .delete();
  }
};
