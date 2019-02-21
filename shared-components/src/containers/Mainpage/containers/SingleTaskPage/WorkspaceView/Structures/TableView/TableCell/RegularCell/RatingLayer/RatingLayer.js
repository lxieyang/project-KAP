import React, { Component } from 'react';
import styles from './RatingLayer.css';

import ThumbV1 from '../../../../../../../../../../components/UI/Thumbs/ThumbV1/ThumbV1';
import InfoIcon from '../../../../../../../../../../components/UI/Thumbs/InfoIcon/InfoIcon';
import * as FirestoreManager from '../../../../../../../../../../firebase/firestore_wrapper';

// dnd stuff
import { DropTarget } from 'react-dnd';
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
    // const item = monitor.getItem();
    // const pieces = props.cell.pieces.map(p => p.pieceId);
    // if (pieces.indexOf(item.id) !== -1) {
    //   return false;
    // }

    return true;
  },

  drop(props, monitor, component) {
    // console.log(`Dropped on cell ${props.cell.id}`);
    const item = monitor.getItem();
    // console.log(item);
    const pieces = props.cell.pieces.map(p => p.pieceId);
    let idx = pieces.indexOf(item.id);
    if (idx !== -1) {
      // should switch rating type
      component.switchRatingTypeOfPiece(item.id);
    } else {
      component.addPieceToThisCell(item.id);
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

  switchRatingTypeOfPiece = pieceId => {
    FirestoreManager.switchPieceRatingType(
      this.props.workspace.id,
      this.props.cell.id,
      pieceId,
      this.props.ratingType
    );
  };

  changePieceType = (pieceId, to = PIECE_TYPES.snippet) => {
    FirestoreManager.switchPieceType(pieceId, null, to);
  };

  render() {
    const { connectDropTarget, canDrop, isOver } = this.props;
    let { ratingType, cell, pieces, editAccess } = this.props;

    let backdropColor = 'fff';
    let icon = <InfoIcon />;
    switch (ratingType) {
      case RATING_TYPES.positive:
        backdropColor = '#ABEBC6';
        icon = <ThumbV1 type={'up'} />;
        break;
      case RATING_TYPES.negative:
        backdropColor = '#F5B7B1';
        icon = <ThumbV1 type={'down'} />;
        break;
      case RATING_TYPES.info:
        backdropColor = '#FCE500';
        icon = <InfoIcon />;
        break;
      default:
        break;
    }

    return connectDropTarget(
      <div className={styles.RatingLayerContainer}>
        <div
          className={styles.RatingLayer}
          style={{
            backgroundColor: backdropColor,
            opacity: isOver ? '1' : '0'
          }}
        >
          <div style={{ width: '50px', height: '50px', marginTop: '5px' }}>
            {icon}
          </div>
        </div>
      </div>
    );
  }
}

export default DropTarget(['PIECE_ITEM'], dropTarget, collectDrop)(RatingLayer);
