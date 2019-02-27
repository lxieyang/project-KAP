/* global chrome */
import React, { Component } from 'react';
import styles from './RatingLayer.css';

import ThumbV1 from '../../../../../../../../../../../shared-components/src/components/UI/Thumbs/ThumbV1/ThumbV1';
import InfoIcon from '../../../../../../../../../../../shared-components/src/components/UI/Thumbs/InfoIcon/InfoIcon';
import { thumbUpSrc } from '../../../../../../../../../../../shared-components/src/components/UI/Thumbs/ThumbV1/ThumbV1';
import { thumbDownSrc } from '../../../../../../../../../../../shared-components/src/components/UI/Thumbs/ThumbV1/ThumbV1';
import { infoIconSrc } from '../../../../../../../../../../../shared-components/src/components/UI/Thumbs/InfoIcon/InfoIcon';

import * as FirestoreManager from '../../../../../../../../../../../shared-components/src/firebase/firestore_wrapper';

// dnd stuff
import { DropTarget } from 'react-dnd';
import PropTypes from 'prop-types';
import {
  RATING_TYPES,
  PIECE_TYPES
} from '../../../../../../../../../../../shared-components/src/shared/types';

const dropTarget = {
  canDrop(props, monitor, component) {
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

  putSelectedAnnotationHere = e => {
    e.stopPropagation();
    // console.log(
    //   `should be put in cell '${this.props.cell.id}' as a type ${
    //     this.props.ratingType
    //   } rating`
    // );
    chrome.runtime.sendMessage({
      msg: 'ANNOTATION_LOCATION_SELECTED',
      payload: {
        tableId: this.props.workspace.id,
        cellId: this.props.cell.id,
        ratingType: this.props.ratingType
      }
    });
  };

  render() {
    const { connectDropTarget, canDrop, isOver } = this.props;
    let { ratingType, cell, pieces, annotation_selected } = this.props;

    let backdropColor = 'fff';
    // let icon = <InfoIcon />;
    // switch (ratingType) {
    //   case RATING_TYPES.positive:
    //     backdropColor = '#ABEBC6';
    //     icon = <ThumbV1 type={'up'} />;
    //     break;
    //   case RATING_TYPES.negative:
    //     backdropColor = '#F5B7B1';
    //     icon = <ThumbV1 type={'down'} />;
    //     break;
    //   case RATING_TYPES.info:
    //     backdropColor = '#FCE500';
    //     icon = <InfoIcon />;
    //     break;
    //   default:
    //     break;
    // }

    let icon = infoIconSrc;
    switch (ratingType) {
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
      default:
        break;
    }

    return connectDropTarget(
      <div className={styles.RatingLayerContainer}>
        <div
          className={[
            styles.RatingLayer,
            annotation_selected ? styles.AnnotationSelectedRatingLayer : null
          ].join(' ')}
          onClick={e => this.putSelectedAnnotationHere(e)}
          style={{
            backgroundColor: backdropColor,
            opacity: !annotation_selected && isOver ? 1 : null
          }}
        >
          <div
            style={{
              width: '95%',
              height: '100%',
              paddingTop: '5px',
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

export default DropTarget(['PIECE_ITEM'], dropTarget, collectDrop)(RatingLayer);
