import React, { Component } from 'react';
import styles from './PieceDropLayer.css';

import * as FirestoreManager from '../../../../../../../../../../firebase/firestore_wrapper';

import Delete from 'mdi-material-ui/Delete';
import DeleteEmpty from 'mdi-material-ui/DeleteEmpty';

// dnd stuff
import { DropTarget } from 'react-dnd';
import PropTypes from 'prop-types';

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
    const { id } = monitor.getItem();
    const { containerType } = props;

    if (containerType === 'trash') {
      component.removePieceFromCell(id);
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

class PieceDropLayer extends Component {
  state = {
    containerType: this.props.containerType
  };

  static propTypes = {
    // Injected by React DnD:
    connectDropTarget: PropTypes.func.isRequired,
    isOver: PropTypes.bool.isRequired,
    canDrop: PropTypes.bool.isRequired
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
    // let { containerType } = this.props;

    let backdropColor = '#d9d9db';
    let icon = isOver ? (
      <DeleteEmpty style={{ fontSize: '28px' }} />
    ) : (
      <Delete style={{ fontSize: '28px' }} />
    );
    let promptText = 'Remove';

    let promptTextContainer = isOver && (
      <div
        style={{
          position: 'absolute',
          left: 3,
          top: -20,
          height: 20,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontSize: 12,
          fontWeight: 400
        }}
      >
        {promptText}
      </div>
    );

    return connectDropTarget(
      <div
        className={styles.PieceDropLayerContainer}
        style={{
          position: 'relative',
          opacity: isOver ? 1 : 0,
          transform: isOver ? 'scale(1.1)' : null
        }}
      >
        {promptTextContainer}

        <div
          className={styles.PieceDropLayer}
          style={{
            backgroundColor: backdropColor,

            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'center',
            fontSize: 11,
            fontWeight: 400
          }}
        >
          <div style={{ width: '28px', height: '28px', marginLeft: 10 }}>
            {icon}
          </div>
        </div>
      </div>
    );
  }
}

export default DropTarget(['PIECE_ITEM'], dropTarget, collectDrop)(
  PieceDropLayer
);
