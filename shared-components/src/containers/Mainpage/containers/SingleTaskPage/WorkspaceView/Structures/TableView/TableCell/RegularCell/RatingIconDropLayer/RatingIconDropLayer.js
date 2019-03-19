import React, { Component } from 'react';
import styles from './RatingIconDropLayer.css';

import ThumbV1 from '../../../../../../../../../../components/UI/Thumbs/ThumbV1/ThumbV1';
import InfoIcon from '../../../../../../../../../../components/UI/Thumbs/InfoIcon/InfoIcon';
import * as FirestoreManager from '../../../../../../../../../../firebase/firestore_wrapper';

import Delete from 'mdi-material-ui/Delete';
import DeleteEmpty from 'mdi-material-ui/DeleteEmpty';

// dnd stuff
import { DropTarget } from 'react-dnd';
import PropTypes from 'prop-types';
import { RATING_TYPES } from '../../../../../../../../../../shared/types';

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
    const { pieceId } = monitor.getItem();
    const { containerType } = props;

    if (containerType === 'trash') {
      component.removePieceFromCell(pieceId);
    } else {
      component.switchRatingTypeOfPiece(pieceId, containerType);
    }
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

  switchRatingTypeOfPiece = (pieceId, ratingType) => {
    FirestoreManager.switchPieceRatingType(
      this.props.workspace.id,
      this.props.cell.id,
      pieceId,
      ratingType
    );
  };

  removePieceFromCell = pieceId => {
    FirestoreManager.deletePieceInTableCellById(
      this.props.workspace.id,
      this.props.cell.id,
      pieceId
    );
  };

  render() {
    const { connectDropTarget, canDrop, isOver } = this.props;
    let { containerType } = this.props;

    let backdropColor = 'fff';
    let icon = <InfoIcon />;
    let promptText = 'Change to:';
    switch (containerType) {
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
      case 'trash':
        promptText = 'Remove';
        backdropColor = '#d9d9db';
        icon = isOver ? (
          <DeleteEmpty style={{ fontSize: '36px' }} />
        ) : (
          <Delete style={{ fontSize: '36px' }} />
        );
        break;
      default:
        break;
    }

    return connectDropTarget(
      <div
        className={styles.RatingIconDropLayerContainer}
        style={{
          opacity: isOver ? 1 : 0.4,
          transform: isOver ? 'scale(1.1)' : null
        }}
      >
        <div
          className={styles.RatingIconDropLayer}
          style={{
            backgroundColor: backdropColor,

            display: 'flex',
            flexFlow: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: 11,
            fontWeight: 400
          }}
        >
          {promptText}
          <div style={{ width: '36px', height: '36px', marginTop: '5px' }}>
            {icon}
          </div>
        </div>
      </div>
    );
  }
}

export default DropTarget(['RATING_ICON'], dropTarget, collectDrop)(
  RatingIconDropLayer
);
