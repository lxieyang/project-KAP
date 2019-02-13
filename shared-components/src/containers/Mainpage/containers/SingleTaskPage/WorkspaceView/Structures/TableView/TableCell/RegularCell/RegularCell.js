import React, { Component } from 'react';
import styled from 'styled-components';
import styles from './RegularCell.css';

import PieceItem from '../../../../../CollectionView/PiecesView/PieceItem/PieceItem';

import * as FirestoreManager from '../../../../../../../../../firebase/firestore_wrapper';

// dnd stuff
import { DragSource, DropTarget } from 'react-dnd';
import PropTypes from 'prop-types';

const dropTarget = {
  canDrop(props, monitor, component) {
    // can't drop if no edit access
    if (!props.editAccess) {
      return false;
    }

    // can't drop if already exist
    const item = monitor.getItem();
    const pieces = props.cell.pieces.map(p => p.pieceId);
    if (pieces.indexOf(item.id) !== -1) {
      return false;
    }

    return true;
  },

  drop(props, monitor, component) {
    console.log(`Dropped on cell ${props.cell.id}`);
    const item = monitor.getItem();
    console.log(item);

    component.addPieceToThisCell(item.id);

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

class RegularCell extends Component {
  static propTypes = {
    // Injected by React DnD:
    connectDropTarget: PropTypes.func.isRequired,
    isOver: PropTypes.bool.isRequired,
    canDrop: PropTypes.bool.isRequired
  };

  addPieceToThisCell = pieceId => {
    FirestoreManager.addPieceToTableCellById(
      this.props.workspace.id,
      this.props.cell.id,
      pieceId
    );
  };

  render() {
    const { connectDropTarget, canDrop, isOver } = this.props;
    let { cell, pieces, editAccess } = this.props;

    if (cell === null || pieces === null) {
      return <td />;
    }

    return connectDropTarget(
      <td className={styles.RegularCell}>
        <div
          className={styles.RegularCellContainer}
          style={{ backgroundColor: isOver && canDrop ? '#f5b7b1' : null }}
        >
          {cell.pieces.map((p, idx) => {
            return (
              <div
                key={`${p.pieceId}-${idx}`}
                style={{ width: '300px', minHeight: '65px' }}
              >
                <PieceItem
                  piece={pieces[p.pieceId]}
                  editAccess={editAccess}
                  cellId={cell.id}
                  cellType={cell.type}
                  openScreenshot={this.props.openScreenshot}
                />
              </div>
            );
          })}
        </div>
      </td>
    );
  }
}

export default DropTarget(['PIECE_ITEM'], dropTarget, collectDrop)(RegularCell);
