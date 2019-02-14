import React, { Component } from 'react';
import styled from 'styled-components';
import styles from './ColumnHeaderCell.css';

import PieceItem from '../../../../../CollectionView/PiecesView/PieceItem/PieceItem';

import * as FirestoreManager from '../../../../../../../../../firebase/firestore_wrapper';

import { withStyles } from '@material-ui/core/styles';
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import Tooltip from '@material-ui/core/Tooltip';

import { ContextMenu, MenuItem, ContextMenuTrigger } from 'react-contextmenu';

// dnd stuff
import { DragSource, DropTarget } from 'react-dnd';
import PropTypes from 'prop-types';
import {
  PIECE_TYPES,
  TABLE_CELL_TYPES
} from '../../../../../../../../../shared/types';

const materialStyles = theme => ({
  iconButtons: {
    padding: '4px'
  },
  iconInIconButtons: {
    width: '14px',
    height: '14px',
    color: 'rgb(187, 187, 187)'
  }
});

const dropTarget = {
  canDrop(props, monitor, component) {
    // can't drop if no edit access
    if (!props.editAccess) {
      return false;
    }

    // can't drop if already exist
    const dropPieceId = monitor.getItem().id;
    const pieceIds = props.cell.pieces.map(p => p.pieceId);
    if (pieceIds.indexOf(dropPieceId) !== -1) {
      return false;
    }

    return true;
  },

  drop(props, monitor, component) {
    const item = monitor.getItem();
    const dropPieceId = item.id;
    const dropPieceCellId = item.cellId;
    const dropPieceCellType = item.cellType;
    const dropPieceCellColumnIndex = item.columnIndex;

    let pieces = props.cell.pieces.map(p => p.pieceId);
    if (pieces.length === 0) {
      // no stuff in this cell
      component.addPieceToThisCell(dropPieceId);
    } else if (pieces.length > 0 && dropPieceCellId === undefined) {
      // there's existing piece, but dropping on from the pieceView
      component.resetPieceInThisCell(dropPieceId);
    } else if (
      pieces.length > 0 &&
      dropPieceCellId !== undefined &&
      dropPieceCellType === TABLE_CELL_TYPES.columnHeader
    ) {
      // both are from the table, should switch rows
      FirestoreManager.switchColumnsInTable(
        props.workspace.id,
        props.columnIndex,
        dropPieceCellColumnIndex
      );
    }

    return {
      id: props.cell.id
    };
  }
};

const collectDrop = (connect, monitor) => {
  return {
    connectDropTarget: connect.dropTarget(),
    isOver: monitor.isOver(),
    canDrop: monitor.canDrop()
  };
};

class ColumnHeaderCell extends Component {
  state = {};

  static propTypes = {
    // Injected by React DnD:
    connectDropTarget: PropTypes.func.isRequired,
    isOver: PropTypes.bool.isRequired,
    canDrop: PropTypes.bool.isRequired
  };

  deleteTableColumnByIndex = event => {
    FirestoreManager.deleteColumnInTableByIndex(
      this.props.workspace.id,
      this.props.columnIndex
    );
  };

  addPieceToThisCell = pieceId => {
    FirestoreManager.addPieceToTableCellById(
      this.props.workspace.id,
      this.props.cell.id,
      pieceId
    );

    // change type to option
    this.changePieceType(pieceId);
  };

  resetPieceInThisCell = pieceId => {
    FirestoreManager.resetPieceInTableCellById(
      this.props.workspace.id,
      this.props.cell.id,
      pieceId
    );

    // change type to criterion
    this.changePieceType(pieceId);
  };

  changePieceType = (pieceId, to = PIECE_TYPES.criterion) => {
    FirestoreManager.switchPieceType(pieceId, null, to);
  };

  removePieceFromCellClickedHandler = (e, pieceId) => {
    FirestoreManager.deletePieceInTableCellById(
      this.props.workspace.id,
      this.props.cell.id,
      pieceId
    );
  };

  render() {
    const { connectDropTarget, canDrop, isOver } = this.props;
    let { classes, cell, pieces, editAccess, commentAccess } = this.props;

    if (cell === null || pieces === null) {
      return <td />;
    }

    let deleteColumnActionContainer = editAccess ? (
      <div className={styles.DeleteColumnIconContainer}>
        <Tooltip title="Delete this column" placement={'top'}>
          <IconButton
            aria-label="Delete"
            className={classes.iconButtons}
            onClick={() => this.deleteTableColumnByIndex()}
          >
            <DeleteIcon className={classes.iconInIconButtons} />
          </IconButton>
        </Tooltip>
      </div>
    ) : null;

    return connectDropTarget(
      <th
        className={styles.ColumnHeaderCell}
        style={{ backgroundColor: isOver && canDrop ? '#aed6f1' : null }}
      >
        {deleteColumnActionContainer}
        <div
          className={styles.ColumnHeaderCellContainer}
          style={{ backgroundColor: isOver && canDrop ? '#aed6f1' : null }}
        >
          {cell.pieces.map((p, idx) => {
            return (
              <React.Fragment key={`${p.pieceId}-${idx}`}>
                <ContextMenuTrigger
                  id={`${cell.id}-context-menu`}
                  holdToDisplay={-1}
                >
                  <div
                    style={{
                      width: '250px',
                      minHeight: '65px'
                    }}
                  >
                    <PieceItem
                      piece={pieces[p.pieceId]}
                      editAccess={editAccess}
                      commentAccess={commentAccess}
                      cellId={cell.id}
                      cellType={cell.type}
                      rowIndex={this.props.rowIndex}
                      columnIndex={this.props.columnIndex}
                      openScreenshot={this.props.openScreenshot}
                    />
                  </div>
                </ContextMenuTrigger>
                {editAccess ? (
                  <ContextMenu id={`${cell.id}-context-menu`}>
                    <MenuItem
                      onClick={e =>
                        this.removePieceFromCellClickedHandler(e, p.pieceId)
                      }
                    >
                      Remove from table
                    </MenuItem>
                  </ContextMenu>
                ) : null}
              </React.Fragment>
            );
          })}
        </div>
      </th>
    );
  }
}

export default withStyles(materialStyles)(
  DropTarget(['PIECE_ITEM'], dropTarget, collectDrop)(ColumnHeaderCell)
);
