import React, { Component } from 'react';
import styles from './RatingIconDropLayer.css';

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
    console.log(`Dropped on ${props.containerType}`);

    // console.log(`Dropped on cell ${props.cell.id}`);
    // const item = monitor.getItem();
    // // console.log(item);
    // const pieces = props.cell.pieces.map(p => p.pieceId);
    // let idx = pieces.indexOf(item.id);
    // if (idx !== -1) {
    //   // should switch rating type
    //   component.switchRatingTypeOfPiece(item.id);
    // } else {
    //   component.addPieceToThisCell(item.id);
    // }

    // return {
    //   id: props.cell.id
    // };
  }
};

const collectDrop = (connect, monitor) => {
  return {
    connectDropTarget: connect.dropTarget(),
    isOver: monitor.isOver(),
    canDrop: monitor.canDrop()
  };
};

class RatingIconDropLayer extends Component {
  state = {
    containerType: this.props.containerType
  };

  static propTypes = {
    // Injected by React DnD:
    connectDropTarget: PropTypes.func.isRequired,
    isOver: PropTypes.bool.isRequired,
    canDrop: PropTypes.bool.isRequired
  };

  render() {
    const { connectDropTarget, canDrop, isOver } = this.props;
    let { containerType } = this.props;

    return connectDropTarget(
      <div className={styles.RatingIconDropLayerContainer}>
        <div
          className={styles.RatingIconDropLayer}
          style={{
            backgroundColor: 'yellow',
            opacity: isOver ? 1 : 0.5
          }}
        >
          {containerType}
        </div>
      </div>
    );
  }
}

export default DropTarget(['RATING_ICON'], dropTarget, collectDrop)(
  RatingIconDropLayer
);
