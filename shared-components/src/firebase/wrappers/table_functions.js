import firebase from '../firebase';
import {
  WORKSPACE_TYPES,
  TABLE_CELL_TYPES,
  RATING_TYPES
} from '../../shared/types';
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

export const putOptionIntoDefaultTable = async ({ taskId, pieceId }) => {
  let currentTaskId = (await getCurrentUserCurrentTaskId().get()).data().id;
  let task = taskId ? taskId : currentTaskId;
  let tableId = (await db
    .collection('workspaces')
    .where('references.task', '==', task)
    .orderBy('updateDate', 'desc')
    .limit(1)
    .get()).docs[0].id;

  let rowHeaderId = await createNewRowInTable(tableId);
  resetPieceInTableCellById(tableId, rowHeaderId, pieceId);
};

export const putCriterionIntoDefaultTable = async ({ taskId, pieceId }) => {
  let currentTaskId = (await getCurrentUserCurrentTaskId().get()).data().id;
  let task = taskId ? taskId : currentTaskId;
  let tableId = (await db
    .collection('workspaces')
    .where('references.task', '==', task)
    .orderBy('updateDate', 'desc')
    .limit(1)
    .get()).docs[0].id;

  let columnHeaderId = await createNewColumnInTable(tableId);
  resetPieceInTableCellById(tableId, columnHeaderId, pieceId);
};

export const getAllTableCellsInTableById = tableId => {
  return getWorkspaceById(tableId).collection('cells');
};

export const getTableCellById = (tableId, cellId) => {
  return getAllTableCellsInTableById(tableId).doc(cellId);
};

export const getAllCommentsToTableCell = (tableId, cellId) => {
  return getTableCellById(tableId, cellId).collection('comments');
};

export const updateTaskUpdateTimeUponChangesToTable = async tableId => {
  let taskId = (await getWorkspaceById(tableId).get()).data().references.task;
  updateTaskUpdateTime(taskId);
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
    type: tableCellType,
    pieces: [],
    content: ''
  });

  return ref.id;
};

export const deleteTableCellById = (tableId, cellId) => {
  getTableCellById(tableId, cellId).delete();
};

export const setTableCellContentById = (tableId, cellId, content) => {
  getTableCellById(tableId, cellId).set(
    {
      content
    },
    { merge: true }
  );

  // update task updated time
  updateTaskUpdateTimeUponChangesToTable(tableId);
};

export const switchTableCellCheckedStatus = (tableId, cellId, to) => {
  getTableCellById(tableId, cellId).set(
    {
      checked: to
    },
    { merge: true }
  );

  // update task updated time
  updateTaskUpdateTimeUponChangesToTable(tableId);
};

/* commenting */
export const addCommentToATableCellById = (
  tableId,
  cellId,
  newCommentContent
) => {
  getTableCellById(tableId, cellId)
    .collection('comments')
    .add({
      content: newCommentContent,
      creationDate: firebase.firestore.FieldValue.serverTimestamp(),
      updateDate: firebase.firestore.FieldValue.serverTimestamp(),
      authorId: getCurrentUserId(),
      authorName: getCurrentUser().displayName,
      authorAvatarURL: getCurrentUser().photoURL
    })
    .then(() => {});

  // update task updated time
  updateTaskUpdateTimeUponChangesToTable(tableId);
};

export const updateTableCellCommentById = (
  tableId,
  cellId,
  commentId,
  newCommentContent
) => {
  getTableCellById(tableId, cellId)
    .collection('comments')
    .doc(commentId)
    .update({
      content: newCommentContent,
      authorName: getCurrentUser().displayName,
      authorAvatarURL: getCurrentUser().photoURL,
      updateDate: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {});

  // update task updated time
  updateTaskUpdateTimeUponChangesToTable(tableId);
};

export const deleteTableCellCommentById = (tableId, cellId, commentId) => {
  // update task updated time
  updateTaskUpdateTimeUponChangesToTable(tableId);

  return getTableCellById(tableId, cellId)
    .collection('comments')
    .doc(commentId)
    .delete()
    .then(() => {});
};

export const updatePiecesTableCellById = (tableId, cellId, pieces) => {
  // update task updated time
  updateTaskUpdateTimeUponChangesToTable(tableId);

  return getTableCellById(tableId, cellId).update({
    pieces
  });
};

export const addPieceToTableCellById = async (
  tableId,
  cellId,
  pieceId,
  rating = RATING_TYPES.noRating
) => {
  let pieces = (await getTableCellById(tableId, cellId).get()).data().pieces;
  let pieceIds = pieces.map(p => p.pieceId);
  if (pieceIds.indexOf(pieceId) !== -1) {
    return;
  }
  pieces.push({
    pieceId: pieceId,
    rating: rating
  });
  return updatePiecesTableCellById(tableId, cellId, pieces);
};

export const switchPieceRatingType = async (
  tableId,
  cellId,
  pieceId,
  rating = RATING_TYPES.noRating
) => {
  let pieces = (await getTableCellById(tableId, cellId).get()).data().pieces;
  for (let i = 0; i < pieces.length; i++) {
    if (pieces[i].pieceId === pieceId) {
      pieces[i].rating = rating;
      break;
    }
  }
  return updatePiecesTableCellById(tableId, cellId, pieces);
};

export const deletePieceInTableCellById = async (tableId, cellId, pieceId) => {
  let pieces = (await getTableCellById(tableId, cellId).get()).data().pieces;
  pieces = pieces.filter(p => p.pieceId !== pieceId);
  return updatePiecesTableCellById(tableId, cellId, pieces);
};

export const resetPieceInTableCellById = async (
  tableId,
  cellId,
  pieceId,
  rating = RATING_TYPES.noRating
) => {
  let pieces = [
    {
      pieceId: pieceId,
      rating: rating
    }
  ];
  return updatePiecesTableCellById(tableId, cellId, pieces);
};

export const createNewRowInTable = async (tableId, beginning = false) => {
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
  if (beginning) {
    tableRows.splice(1, 0, { data: row });
  } else {
    tableRows.push({ data: row });
  }
  updateTableData(tableId, tableRows);

  return row[0];
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

export const createNewColumnInTable = async (tableId, beginning = false) => {
  let tableRows = (await db
    .collection('workspaces')
    .doc(tableId)
    .get()).data().data;

  let numRows = tableRows.length;
  let retVal;
  for (let i = 0; i < numRows; i++) {
    let cell;
    if (i === 0) {
      cell = createNewTableCell(tableId, TABLE_CELL_TYPES.columnHeader);
      retVal = cell;
    } else if (i > 0) {
      cell = createNewTableCell(tableId, TABLE_CELL_TYPES.regularCell);
    }
    if (beginning) {
      tableRows[i].data.splice(1, 0, cell);
    } else {
      tableRows[i].data.push(cell);
    }
  }
  updateTableData(tableId, tableRows);

  return retVal;
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

export const switchHideStatusOfTableCells = (tableId, cellIds, toStatus) => {
  // Get a new write batch
  let batch = db.batch();
  cellIds.forEach(cellId => {
    batch.update(getTableCellById(tableId, cellId), { hide: toStatus });
  });

  // Commit the batch
  batch.commit().then(function() {
    // console.log('cleared');
  });
};

export const switchHideColumnStatusInTableByIndex = async (
  tableId,
  toHideColumnIdx,
  toStatus
) => {
  let tableRows = (await getWorkspaceById(tableId).get()).data().data;

  let toHideCellIds = [];
  for (let i = 0; i < tableRows.length; i++) {
    toHideCellIds.push(tableRows[i].data[toHideColumnIdx]);
  }

  switchHideStatusOfTableCells(tableId, toHideCellIds, toStatus);
};

export const switchHideRowStatusInTableByIndex = async (
  tableId,
  toHideRowIdx,
  toStatus
) => {
  let tableRows = (await getWorkspaceById(tableId).get()).data().data;

  let toHideCellIds = [...tableRows[toHideRowIdx].data];

  switchHideStatusOfTableCells(tableId, toHideCellIds, toStatus);
};

export const switchRowsInTable = async (tableId, rowIndex1, rowIndex2) => {
  let tableRows = (await getWorkspaceById(tableId).get()).data().data;
  let row1Data = [...tableRows[rowIndex1].data];
  tableRows[rowIndex1].data = tableRows[rowIndex2].data;
  tableRows[rowIndex2].data = row1Data;
  updateTableData(tableId, tableRows);
};

export const switchColumnsInTable = async (
  tableId,
  columnIndex1,
  columnIndex2
) => {
  let tableRows = (await getWorkspaceById(tableId).get()).data().data;
  for (let i = 0; i < tableRows.length; i++) {
    let column1Data = tableRows[i].data[columnIndex1];
    tableRows[i].data[columnIndex1] = tableRows[i].data[columnIndex2];
    tableRows[i].data[columnIndex2] = column1Data;
  }
  updateTableData(tableId, tableRows);
};

export const updateTableData = (tableId, tableRows) => {
  // update task updated time
  updateTaskUpdateTimeUponChangesToTable(tableId);

  return getWorkspaceById(tableId).update({
    data: tableRows
  });
};

export const createNewTable = async ({ name, creatorId, taskId }) => {
  let currentUserId = getCurrentUserId();
  let currentTaskId = (await getCurrentUserCurrentTaskId().get()).data().id;
  let workspaceType = WORKSPACE_TYPES.table;
  let ref = db.collection('workspaces').doc(); // create new table

  // construct table with 2x2 cells:
  // topLeft    |  columnHeader
  // --------------------------
  // rowHeader  |  regularCell
  let numRows = 2,
    numCols = 2;
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
  updateTaskUpdateTime(table.references.task);
  return ref.id;
};

export const deleteTableById = async tableId => {
  getWorkspaceById(tableId).delete();

  // recursive deletion of subcollections ('cells', 'cells/{cellId}/comments') are handled by
  // 'deleteTablePiecesAndComments' in cloud functions
};
