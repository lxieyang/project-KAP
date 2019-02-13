import React, { Component } from 'react';
import styled from 'styled-components';
import styles from './RatingLayer.css';

import PieceItem from '../../../../../../CollectionView/PiecesView/PieceItem/PieceItem';

import ThumbV1 from '../../../../../../../../../../components/UI/Thumbs/ThumbV1/ThumbV1';
import * as FirestoreManager from '../../../../../../../../../../firebase/firestore_wrapper';

// dnd stuff
import { DragSource, DropTarget } from 'react-dnd';
import PropTypes from 'prop-types';
import {
  RATING_TYPES,
  PIECE_TYPES
} from '../../../../../../../../../../shared/types';

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

class RatingLayer extends Component {
  state = {
    ratingType: this.props.ratingType
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
      pieceId,
      this.props.ratingType
    );

    // change type to snippet
    this.changePieceType(pieceId);
  };

  changePieceType = (pieceId, to = PIECE_TYPES.snippet) => {
    FirestoreManager.switchPieceType(pieceId, null, to);
  };

  render() {
    const { connectDropTarget, canDrop, isOver } = this.props;
    let { ratingType, cell, pieces, editAccess } = this.props;

    return connectDropTarget(
      <div className={styles.RatingLayerContainer}>
        <div
          className={styles.RatingLayer}
          style={{
            backgroundColor:
              ratingType === RATING_TYPES.positive ? '#ABEBC6' : '#F5B7B1',
            opacity: isOver ? '1' : '0'
          }}
        >
          <div style={{ width: '75px', height: '75px' }}>
            <ThumbV1
              type={ratingType === RATING_TYPES.positive ? 'up' : 'down'}
            />
          </div>
        </div>
      </div>
    );
  }
}

export default DropTarget(['PIECE_ITEM'], dropTarget, collectDrop)(RatingLayer);
