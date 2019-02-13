import React, { Component } from 'react';
import styled from 'styled-components';
import styles from './RowHeaderCell.css';

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
    const dropPieceCellRowIndex = item.rowIndex;

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
      dropPieceCellType === TABLE_CELL_TYPES.rowHeader
    ) {
      // both are from the table, should switch rows
      FirestoreManager.switchRowsInTable(
        props.workspace.id,
        props.rowIndex,
        dropPieceCellRowIndex
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

class RowHeaderCell extends Component {
  static propTypes = {
    // Injected by React DnD:
    connectDropTarget: PropTypes.func.isRequired,
    isOver: PropTypes.bool.isRequired,
    canDrop: PropTypes.bool.isRequired
  };

  deleteTableRowByIndex = event => {
    FirestoreManager.deleteRowInTableByIndex(
      this.props.workspace.id,
      this.props.rowIndex
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

    // change type to option
    this.changePieceType(pieceId);
  };

  changePieceType = (pieceId, to = PIECE_TYPES.option) => {
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
    let { classes, cell, pieces, editAccess } = this.props;

    if (cell === null || pieces === null) {
      return <td />;
    }

    let deleteRowActionContainer = editAccess ? (
      <div className={styles.DeleteColumnIconContainer}>
        <Tooltip title="Delete this row" placement={'top'}>
          <IconButton
            aria-label="Delete"
            className={classes.iconButtons}
            onClick={() => this.deleteTableRowByIndex()}
          >
            <DeleteIcon className={classes.iconInIconButtons} />
          </IconButton>
        </Tooltip>
      </div>
    ) : null;

    return connectDropTarget(
      <td className={styles.RowHeaderCell}>
        {deleteRowActionContainer}

        <div
          className={styles.RowHeaderCellContainer}
          style={{ backgroundColor: isOver && canDrop ? '#f8c471' : null }}
        >
          {cell.pieces.map((p, idx) => {
            return (
              <React.Fragment key={`${p.pieceId}-${idx}`}>
                <ContextMenuTrigger id={`${cell.id}-context-menu`}>
                  <div style={{ width: '300px', minHeight: '65px' }}>
                    <PieceItem
                      piece={pieces[p.pieceId]}
                      editAccess={editAccess}
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
      </td>
    );
  }
}

export default withStyles(materialStyles)(
  DropTarget(['PIECE_ITEM'], dropTarget, collectDrop)(RowHeaderCell)
);
