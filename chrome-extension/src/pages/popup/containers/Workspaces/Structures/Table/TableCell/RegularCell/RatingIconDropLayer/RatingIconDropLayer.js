import React, { Component } from 'react';
import styles from './RatingIconDropLayer.css';

import { thumbUpSrc } from '../../../../../../../../../../../shared-components/src/components/UI/Thumbs/ThumbV1/ThumbV1';
import { thumbDownSrc } from '../../../../../../../../../../../shared-components/src/components/UI/Thumbs/ThumbV1/ThumbV1';
import { infoIconSrc } from '../../../../../../../../../../../shared-components/src/components/UI/Thumbs/InfoIcon/InfoIcon';
import { deleteIconSrc } from '../../../../../../../../../../../shared-components/src/components/UI/Thumbs/DeleteIcon/DeleteIcon';
import { deleteEmptyIconSrc } from '../../../../../../../../../../../shared-components/src/components/UI/Thumbs/DeleteIcon/DeleteEmptyIcon';

import * as FirestoreManager from '../../../../../../../../../../../shared-components/src/firebase/firestore_wrapper';

// dnd stuff
import { DropTarget } from 'react-dnd';
import PropTypes from 'prop-types';
import { RATING_TYPES } from '../../../../../../../../../../../shared-components/src/shared/types';

const dropTarget = {
  canDrop(props, monitor, component) {
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
      ratingType,
      this.props.pieceRating
    );
  };

  removePieceFromCell = async pieceId => {
    await FirestoreManager.Table_RemoveEvidencePiece(
      this.props.workspace.id,
      this.props.cell.id,
      pieceId,
      this.props.pieceRating
    );

    FirestoreManager.deletePieceInTableCellById(
      this.props.workspace.id,
      this.props.cell.id,
      pieceId
    );

    // in case it's selected
    if (
      this.props.currentSelectedPieceInTable !== null &&
      this.props.currentSelectedPieceInTable.pieceId === pieceId
    ) {
      this.props.setCurrentSelectedPieceInTable({
        pieceId: null,
        pieceType: null
      });
    }
  };

  render() {
    const { connectDropTarget, canDrop, isOver } = this.props;
    let { containerType } = this.props;

    let backdropColor = 'fff';
    let icon = infoIconSrc;
    let promptText = 'Change to:';
    switch (containerType) {
      case RATING_TYPES.positive:
        backdropColor = '#ABEBC6';
        icon = thumbUpSrc;
        break;
      case RATING_TYPES.negative:
        backdropColor = '#F5B7B1';
        icon = thumbDownSrc;
        break;
      case RATING_TYPES.info:
        backdropColor = '#FCE500';
        icon = infoIconSrc;
        break;
      case 'trash':
        promptText = 'Remove';
        backdropColor = '#d9d9db';
        icon = isOver ? deleteEmptyIconSrc : deleteIconSrc;
        break;
      default:
        break;
    }

    let promptTextContainer = isOver && (
      <div
        style={{
          position: 'absolute',
          top: -20,
          height: 20,
          left: -20,
          right: this.props.columnIndex === this.props.numColumns - 1 ? 0 : -20,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontSize: 10,
          fontWeight: 500
        }}
      >
        <div
          style={{
            padding: '1px 4px',
            backgroundColor: 'white'
          }}
        >
          {promptText}
        </div>
      </div>
    );

    return connectDropTarget(
      <div
        className={styles.RatingIconDropLayerContainer}
        style={{
          position: 'relative',
          opacity: isOver ? 1 : 0.4,
          transform: isOver ? 'scale(1.1)' : null
        }}
      >
        {promptTextContainer}
        <div
          className={styles.RatingIconDropLayer}
          style={{
            backgroundColor: backdropColor,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <div
            style={{
              width: '90%',
              height: '100%',
              paddingTop: '5px',
              paddingBottom: '5px',
              boxSizing: 'border-box'
            }}
          >
            {/* icon */}
            <div
              // https://stackoverflow.com/questions/9994493/scale-image-to-fit-a-bounding-box/10016640#10016640
              style={{
                backgroundColor: 'transparent',
                backgroundImage: `url(${icon})`,
                backgroundRepeat: 'no-repeat',
                backgroundPositionX: 'center',
                backgroundSize: 'contain',
                height: '100%',
                width: '100%'
              }}
            />
          </div>
        </div>
      </div>
    );
  }
}

export default DropTarget(['RATING_ICON'], dropTarget, collectDrop)(
  RatingIconDropLayer
);
