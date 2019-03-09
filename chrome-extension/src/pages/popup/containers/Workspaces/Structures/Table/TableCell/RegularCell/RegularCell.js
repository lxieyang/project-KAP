import React, { Component } from 'react';
import { sortBy, debounce } from 'lodash';
import styles from './RegularCell.css';
import ThumbV1 from '../../../../../../../../../../shared-components/src/components/UI/Thumbs/ThumbV1/ThumbV1';
import InfoIcon from '../../../../../../../../../../shared-components/src/components/UI/Thumbs/InfoIcon/InfoIcon';

// import PieceItem from '../../../../../CollectionView/PiecesView/PieceItem/PieceItem';
import RatingLayer from './RatingLayer/RatingLayer';
import * as FirestoreManager from '../../../../../../../../../../shared-components/src/firebase/firestore_wrapper';
import {
  PIECE_TYPES,
  TABLE_CELL_TYPES,
  ANNOTATION_TYPES,
  RATING_TYPES
} from '../../../../../../../../../../shared-components/src/shared/types';
import {
  THEME_COLOR,
  PIECE_COLOR
} from '../../../../../../../../../../shared-components/src/shared/theme';

import { withStyles } from '@material-ui/core/styles';

import Textarea from 'react-textarea-autosize';
import { ContextMenu, MenuItem, ContextMenuTrigger } from 'react-contextmenu';

// dnd stuff
import { DragSource, DropTarget } from 'react-dnd';
import PropTypes from 'prop-types';

// import CellComments from '../CellComments/CellComments';
import { getFirstNWords } from '../../../../../../../../../../shared-components/src/shared/utilities';

const materialStyles = theme => ({
  iconButtons: {
    padding: '4px'
  },
  iconInIconButtons: {
    width: '14px',
    height: '14px',
    color: 'rgb(187, 187, 187)'
  }
});

const dropTarget = {
  canDrop(props, monitor, component) {
    return true;
  },

  drop(props, monitor, component) {
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
    contentEdit: this.props.cell.content,

    // comment popover
    anchorEl: null
  };

  static propTypes = {
    // Injected by React DnD:
    connectDropTarget: PropTypes.func.isRequired,
    isOver: PropTypes.bool.isRequired,
    canDrop: PropTypes.bool.isRequired
  };

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.cell.content !== this.props.cell.content)
      this.setState({ contentEdit: this.props.cell.content });
  }

  componentDidMount() {
    this.keyPress = this.keyPress.bind(this);
    this.saveContentCallback = debounce(event => {
      FirestoreManager.setTableCellContentById(
        this.props.workspace.id,
        this.props.cell.id,
        event.target.value
      );
    }, 1000);
  }

  handleCommentClick = event => {
    this.setState({
      anchorEl: event.currentTarget
    });
  };

  handleCommentClose = () => {
    this.setState({
      anchorEl: null
    });
  };

  keyPress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      this.saveCellContentClickedHandler(e);
    }
  }

  handleCellContentInputChange = e => {
    e.persist();
    this.setState({ contentEdit: e.target.value });
    this.saveContentCallback(e);
  };

  saveCellContentClickedHandler = e => {
    e.stopPropagation();
    this.textarea.blur();
    FirestoreManager.setTableCellContentById(
      this.props.workspace.id,
      this.props.cell.id,
      this.state.contentEdit
    );
  };

  removePieceFromCellClickedHandler = (e, pieceId) => {
    e.stopPropagation();
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

  switchRatingTypeOfPiece = (e, pieceId, ratingType) => {
    e.stopPropagation();
    FirestoreManager.switchPieceRatingType(
      this.props.workspace.id,
      this.props.cell.id,
      pieceId,
      ratingType
    );
  };

  ratingIconClickedHandler = (e, pieceId, pieceType) => {
    e.stopPropagation();

    this.props.setCurrentSelectedPieceInPieces({
      pieceId: null,
      pieceType: null
    });

    if (
      this.props.currentSelectedPieceInTable === null ||
      this.props.currentSelectedPieceInTable.pieceId !== pieceId
    ) {
      this.props.setCurrentSelectedPieceInTable({ pieceId, pieceType });
    } else {
      this.props.setCurrentSelectedPieceInTable({
        pieceId: null,
        pieceType: null
      });
    }
  };

  render() {
    const { connectDropTarget, canDrop, isOver } = this.props;

    let {
      classes,
      cell,
      pieces,
      comments,
      commentCount,
      annotation_selected,
      selected_annotation_id
    } = this.props;
    const { anchorEl } = this.state;
    const open = Boolean(anchorEl);

    if (cell === null || pieces === null) {
      return <td />;
    }

    let piecesList = cell.pieces;

    return connectDropTarget(
      <td
        className={styles.RegularCell}
        style={{
          // zoom: isOver ? 3 : null,
          backgroundColor:
            this.props.columnIndex === this.props.columnToDelete
              ? THEME_COLOR.alertBackgroundColor
              : 'transparent'
        }}
      >
        {/* hover to drop layer */}
        <div
          className={styles.HoverLayer}
          style={{ zIndex: isOver || annotation_selected ? 1000 : -1 }}
        >
          <div className={styles.HoverLayerPane}>
            <RatingLayer ratingType={RATING_TYPES.positive} {...this.props} />
          </div>
          <div className={styles.HoverLayerPane}>
            <RatingLayer ratingType={RATING_TYPES.negative} {...this.props} />
          </div>
          <div className={styles.HoverLayerPane}>
            <RatingLayer ratingType={RATING_TYPES.info} {...this.props} />
          </div>
        </div>

        {/* regular */}
        <div
          className={styles.RegularContentContainer}
          style={{
            transition: 'all 0.1s ease-in'
            // opacity: isOver || annotation_selected ? 0.2 : null // apply these styles to each individual child element
          }}
        >
          {piecesList.length > 0 ? (
            <div className={styles.EvidenceIconContainer}>
              {sortBy(piecesList, ['rating']).map((p, idx) => {
                let piece = pieces[p.pieceId];
                if (piece !== undefined && piece !== null) {
                  let icon = <InfoIcon />;
                  switch (p.rating) {
                    case RATING_TYPES.positive:
                      icon = <ThumbV1 type={'up'} />;
                      break;
                    case RATING_TYPES.negative:
                      icon = <ThumbV1 type={'down'} />;
                      break;
                    case RATING_TYPES.info:
                      icon = <InfoIcon />;
                      break;
                    default:
                      break;
                  }
                  return (
                    <React.Fragment key={`${p.pieceId}-${idx}`}>
                      <ContextMenuTrigger
                        renderTag={'span'}
                        id={`${cell.id}-${p.pieceId}-${idx}-context-menu`}
                        holdToDisplay={-1}
                      >
                        <div
                          style={{
                            opacity:
                              isOver ||
                              (annotation_selected &&
                                selected_annotation_id !== p.pieceId)
                                ? 0.2
                                : null
                          }}
                          className={[
                            styles.AttitudeInTableCell,
                            (this.props.currentSelectedPieceInTable !== null &&
                              this.props.currentSelectedPieceInTable.pieceId ===
                                piece.id) ||
                            (this.props.currentSelectedPieceInPieces !== null &&
                              this.props.currentSelectedPieceInPieces
                                .pieceId === piece.id) ||
                            (annotation_selected &&
                              selected_annotation_id === p.pieceId)
                              ? styles.AttitudeInTableCellSelected
                              : null,
                            (this.props.currentSelectedPieceInTable !== null &&
                              this.props.currentSelectedPieceInTable.pieceId !==
                                piece.id) ||
                            (this.props.currentSelectedPieceInPieces !== null &&
                              this.props.currentSelectedPieceInPieces
                                .pieceId !== piece.id)
                              ? styles.AttitudeInTableCellNotSelected
                              : null
                          ].join(' ')}
                          onClick={e =>
                            this.ratingIconClickedHandler(
                              e,
                              piece.id,
                              piece.pieceType
                            )
                          }
                        >
                          {icon}
                        </div>
                      </ContextMenuTrigger>

                      <ContextMenu
                        id={`${cell.id}-${p.pieceId}-${idx}-context-menu`}
                      >
                        {p.rating !== RATING_TYPES.positive && (
                          <MenuItem
                            onClick={e =>
                              this.switchRatingTypeOfPiece(
                                e,
                                p.pieceId,
                                RATING_TYPES.positive
                              )
                            }
                          >
                            Change to{' '}
                            <div
                              style={{ width: 20, height: 20, marginLeft: 4 }}
                            >
                              <ThumbV1 type={'up'} />
                            </div>
                          </MenuItem>
                        )}
                        {p.rating !== RATING_TYPES.negative && (
                          <MenuItem
                            onClick={e =>
                              this.switchRatingTypeOfPiece(
                                e,
                                p.pieceId,
                                RATING_TYPES.negative
                              )
                            }
                          >
                            Change to{' '}
                            <div
                              style={{ width: 20, height: 20, marginLeft: 4 }}
                            >
                              <ThumbV1 type={'down'} />
                            </div>
                          </MenuItem>
                        )}
                        {p.rating !== RATING_TYPES.info && (
                          <MenuItem
                            onClick={e =>
                              this.switchRatingTypeOfPiece(
                                e,
                                p.pieceId,
                                RATING_TYPES.info
                              )
                            }
                          >
                            Change to{' '}
                            <div
                              style={{ width: 20, height: 20, marginLeft: 4 }}
                            >
                              <InfoIcon />
                            </div>
                          </MenuItem>
                        )}

                        <MenuItem divider />

                        <MenuItem
                          onClick={e =>
                            this.removePieceFromCellClickedHandler(e, p.pieceId)
                          }
                        >
                          Remove from table
                        </MenuItem>
                      </ContextMenu>
                    </React.Fragment>
                  );
                } else {
                  return null;
                }
              })}
            </div>
          ) : null}

          <div
            className={[
              styles.CellContentEditContainer,
              this.state.contentEdit === '' ? styles.HoverToReveal : null
            ].join(' ')}
            style={{ opacity: isOver || annotation_selected ? 0.2 : null }}
          >
            <div
              className={styles.TextAreaContainer}
              title={this.state.contentEdit}
            >
              <Textarea
                inputRef={tag => (this.textarea = tag)}
                disabled={this.props.currentSelectedPieceInTable !== null}
                minRows={1}
                maxRows={3}
                placeholder={''}
                value={this.state.contentEdit}
                onKeyDown={this.keyPress}
                onBlur={e => this.saveCellContentClickedHandler(e)}
                onChange={e => this.handleCellContentInputChange(e)}
                className={[
                  styles.Textarea,
                  this.props.currentSelectedPieceInTable === null ||
                  this.props.currentSelectedPieceInPieces === null
                    ? styles.TextareaHover
                    : null,
                  (this.state.contentEdit !== '' &&
                    this.props.currentSelectedPieceInTable !== null) ||
                  (this.state.contentEdit !== '' &&
                    this.props.currentSelectedPieceInPieces !== null)
                    ? styles.TextareaShouldBeOpaque
                    : null
                ].join(' ')}
              />
            </div>
          </div>
        </div>
      </td>
    );
  }
}

export default withStyles(materialStyles)(
  DropTarget(['PIECE_ITEM'], dropTarget, collectDrop)(RegularCell)
);
