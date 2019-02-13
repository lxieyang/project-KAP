import React, { Component } from 'react';
import styled from 'styled-components';
import { sortBy } from 'lodash';
import styles from './RegularCell.css';
import ReactHoverObserver from 'react-hover-observer';
import ThumbV1 from '../../../../../../../../../components/UI/Thumbs/ThumbV1/ThumbV1';

import PieceItem from '../../../../../CollectionView/PiecesView/PieceItem/PieceItem';
import RatingLayer from './RatingLayer/RatingLayer';
import * as FirestoreManager from '../../../../../../../../../firebase/firestore_wrapper';
import { RATING_TYPES } from '../../../../../../../../../shared/types';
import ReactTooltip from 'react-tooltip';
import { ContextMenu, MenuItem, ContextMenuTrigger } from 'react-contextmenu';

// dnd stuff
import { DragSource, DropTarget } from 'react-dnd';
import PropTypes from 'prop-types';

const dropTarget = {
  canDrop(props, monitor, component) {
    return true;
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

  removePieceFromCellClickedHandler = (e, pieceId) => {
    FirestoreManager.deletePieceInTableCellById(
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
          className={styles.HoverLayer}
          style={{ zIndex: isOver ? 1000 : 980 }}
        >
          <div className={styles.HoverLayerPane}>
            <RatingLayer ratingType={RATING_TYPES.positive} {...this.props} />
          </div>
          <div className={styles.HoverLayerPane}>
            <RatingLayer ratingType={RATING_TYPES.negative} {...this.props} />
          </div>
        </div>

        {/* regular */}
        <div className={styles.RegularContentContainer} style={{ zIndex: 990 }}>
          <div className={styles.EvidenceIconContainer}>
            {sortBy(cell.pieces, ['rating']).map((p, idx) => {
              if (
                pieces[p.pieceId] !== undefined &&
                pieces[p.pieceId] !== null
              ) {
                return (
                  <div key={`${p.pieceId}-${idx}`}>
                    <ContextMenuTrigger
                      id={`${cell.id}-${p.pieceId}-${idx}-context-menu`}
                      holdToDisplay={-1}
                    >
                      <div
                        className={[styles.AttitudeInTableCell].join(' ')}
                        data-tip
                        data-for={`${p.pieceId}`}
                      >
                        <ThumbV1
                          type={
                            p.rating === RATING_TYPES.positive ? 'up' : 'down'
                          }
                        />
                      </div>
                    </ContextMenuTrigger>
                    {editAccess ? (
                      <ContextMenu
                        id={`${cell.id}-${p.pieceId}-${idx}-context-menu`}
                      >
                        <MenuItem
                          onClick={e =>
                            this.removePieceFromCellClickedHandler(e, p.pieceId)
                          }
                        >
                          Remove from table
                        </MenuItem>
                      </ContextMenu>
                    ) : null}
                    <ReactTooltip
                      place="right"
                      type="light"
                      effect="solid"
                      delayHide={100}
                      id={`${p.pieceId}`}
                      className={styles.TooltipOverAttitude}
                      getContent={() => {
                        return (
                          <ContextMenuTrigger
                            id={`${cell.id}-${p.pieceId}-${idx}-context-menu`}
                          >
                            <PieceItem
                              piece={pieces[p.pieceId]}
                              editAccess={editAccess}
                              cellId={cell.id}
                              cellType={cell.type}
                              rowIndex={this.props.rowIndex}
                              columnIndex={this.props.columnIndex}
                              openScreenshot={this.props.openScreenshot}
                            />
                          </ContextMenuTrigger>
                        );
                      }}
                    />
                  </div>
                );
              } else {
                return null;
              }
            })}
          </div>
        </div>
      </td>
    );
  }
}

export default DropTarget(['PIECE_ITEM'], dropTarget, collectDrop)(RegularCell);
