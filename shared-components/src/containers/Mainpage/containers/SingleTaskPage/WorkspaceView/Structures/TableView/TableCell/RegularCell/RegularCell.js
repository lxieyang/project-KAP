import React, { Component } from 'react';
import styled from 'styled-components';
import styles from './RegularCell.css';

import * as FirestoreManager from '../../../../../../../../../firebase/firestore_wrapper';

// dnd stuff
import { DragSource, DropTarget } from 'react-dnd';
import PropTypes from 'prop-types';

const dropTarget = {
  canDrop(props, monitor, component) {
    if (!props.editAccess) {
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
  state = {
    pieces: []
  };

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
    let { cell, pieces } = this.props;

    if (cell === null || pieces === null) {
      return <td />;
    }

    return connectDropTarget(
      <td style={{ backgroundColor: isOver ? '#f5b7b1' : null }}>
        {cell.id}
        <br />
        {cell.pieces.map((p, idx) => {
          return (
            <div key={`${p.pieceId}-${idx}`}>
              {idx + 1} * {pieces[p.pieceId].name} * {p.rating}
            </div>
          );
        })}
      </td>
    );
  }
}

export default DropTarget(['PIECE_ITEM'], dropTarget, collectDrop)(RegularCell);
