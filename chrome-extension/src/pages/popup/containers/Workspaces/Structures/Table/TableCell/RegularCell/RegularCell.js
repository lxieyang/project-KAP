import React, { Component } from 'react';
import { sortBy, debounce } from 'lodash';
import styles from './RegularCell.css';
import Spinner from '../../../../../../../../../../shared-components/src/components/UI/Spinner/Spinner';
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
import Chat from 'mdi-material-ui/Chat';
import BookmarkPlus from 'mdi-material-ui/BookmarkPlus';
import Tooltip from '@material-ui/core/Tooltip';
import IconButton from '@material-ui/core/IconButton';
import Popover from '@material-ui/core/Popover';
import Button from '@material-ui/core/Button';

import Textarea from 'react-textarea-autosize';
import { ContextMenu, MenuItem, ContextMenuTrigger } from 'react-contextmenu';

// dnd stuff
import { DragSource, DropTarget } from 'react-dnd';
import PropTypes from 'prop-types';

// import CellComments from '../CellComments/CellComments';
import { getFirstNWords } from '../../../../../../../../../../shared-components/src/shared/utilities';

import RatingIcon from './components/RatingIcon';
import RatingIconDropLayer from './RatingIconDropLayer/RatingIconDropLayer';

const materialStyles = theme => ({
  button: {
    marginTop: 2,
    marginBottom: 2,
    padding: '2px 6px 2px 6px',
    fontSize: 12
  },
  iconButtons: {
    padding: '4px'
  },
  iconInIconButtons: {
    width: '14px',
    height: '14px',
    color: 'rgb(187, 187, 187)'
  },
  customWidthTooltip: {
    maxWidth: 200
  }
});

const ActionButton = withStyles({
  root: {
    minWidth: '0',
    padding: '0px 4px'
  },
  label: {
    textTransform: 'capitalize'
  }
})(Button);

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
    anchorEl: null,

    // add rating popover
    ratingAnchorEl: null,
    selectedRatingToAdd: RATING_TYPES.positive,
    ratingContentEdit: '',
    addingRatingPieceToCell: false,
    addingRatingPieceRating: RATING_TYPES.noRating,

    // dnd support
    isDraggingRatingIcon: false,
    draggingRatingIconType: RATING_TYPES.noRating
  };

  static propTypes = {
    // Injected by React DnD:
    connectDropTarget: PropTypes.func.isRequired,
    isOver: PropTypes.bool.isRequired,
    canDrop: PropTypes.bool.isRequired
  };

  switchSelectedRating = to => {
    this.setState({ selectedRatingToAdd: to });
  };

  switchDraggingRatingIconStatus = (to, type) => {
    this.setState({ isDraggingRatingIcon: to, draggingRatingIconType: type });
  };

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.cell.content !== this.props.cell.content)
      this.setState({ contentEdit: this.props.cell.content });

    if (prevProps.cell.pieces.length + 1 === this.props.cell.pieces.length) {
      if (prevState.addingRatingPieceToCell === true) {
        this.setState({
          addingRatingPieceToCell: false,
          addingRatingPieceRating: RATING_TYPES.noRating
        });
      }
    }
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
    this.setState({ anchorEl: event.currentTarget });
  };

  handleCommentClose = () => {
    this.setState({ anchorEl: null });
  };

  handleAddRatingClick = event => {
    this.setState({ ratingAnchorEl: event.currentTarget });
  };

  handleAddRatingClose = () => {
    this.setState({
      ratingAnchorEl: null,
      ratingContentEdit: '',
      selectedRatingToAdd: RATING_TYPES.positive
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

  handleRatingContentInputChange = e => {
    this.setState({ ratingContentEdit: e.target.value });
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

  addPieceWithRating = () => {
    let newPieceContent = this.state.ratingContentEdit;
    let newPieceRatingType = this.state.selectedRatingToAdd;
    if (newPieceContent !== '') {
      setTimeout(() => {
        this.setState({
          addingRatingPieceToCell: true,
          addingRatingPieceRating: newPieceRatingType
        });
        // go create piece and eventually add as rating
        FirestoreManager.createPiece(
          {
            text: newPieceContent
          },
          {
            taskId: this.props.taskId
          },
          ANNOTATION_TYPES.Manual,
          PIECE_TYPES.snippet
        )
          .then(pieceId => {
            FirestoreManager.addPieceToTableCellById(
              this.props.workspace.id,
              this.props.cell.id,
              pieceId,
              newPieceRatingType
            );
          })
          .catch(e => {
            this.setState({
              addingRatingPieceToCell: false,
              addingRatingPieceRating: RATING_TYPES.noRating
            });
          });
      }, 5);
    }
    this.handleAddRatingClose();
  };

  switchHideStatusOfThisColumn = toStatus => {
    this.props.setColumnToHide(-1);
    FirestoreManager.switchHideColumnStatusInTableByIndex(
      this.props.workspace.id,
      this.props.columnIndex,
      toStatus
    );
  };

  switchHideStatusOfThisRow = toStatus => {
    this.props.setRowToHide(-1);
    FirestoreManager.switchHideRowStatusInTableByIndex(
      this.props.workspace.id,
      this.props.rowIndex,
      toStatus
    );
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
    const { anchorEl, ratingAnchorEl } = this.state;
    const open = Boolean(anchorEl);
    const addRatingOpen = Boolean(ratingAnchorEl);

    if (cell === null || pieces === null) {
      return <td />;
    }

    if (cell.hide === true) {
      return (
        <td
          style={{
            backgroundImage:
              'linear-gradient(45deg, #ffffff 25%, #e0e0e0 25%, #e0e0e0 50%, #ffffff 50%, #ffffff 75%, #e0e0e0 75%, #e0e0e0 100%)',
            backgroundSize: '11.31px 11.31px'
          }}
          onClick={() => {
            this.switchHideStatusOfThisColumn(false);
            this.switchHideStatusOfThisRow(false);
          }}
        >
          <div style={{ width: '12px', height: '12px' }} />
        </td>
      );
    }

    let addManualRatingPieceContainer = (
      <div
        className={styles.HoverToReveal}
        style={{
          position: 'absolute',
          top: -3,
          right: -3,
          opacity: addRatingOpen ? 1 : null
        }}
      >
        <Tooltip
          title={`Add a new snippet`}
          placement={'top'}
          disableFocusListener={true}
        >
          <IconButton
            aria-label="Add"
            className={classes.iconButtons}
            onClick={e => this.handleAddRatingClick(e)}
          >
            <BookmarkPlus className={classes.iconInIconButtons} />
          </IconButton>
        </Tooltip>

        <Popover
          id={`${cell.id}-add-rating-popover`}
          open={addRatingOpen}
          anchorEl={ratingAnchorEl}
          onClose={this.handleAddRatingClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'center'
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'center'
          }}
        >
          <div className={styles.AddManualRatingPopoverContainer}>
            <div className={styles.RatingEditContainer}>
              <div className={styles.RatingsSelectionPane}>
                <div
                  title={'Change to positive'}
                  className={[
                    styles.RatingToSelectContainer,
                    this.state.selectedRatingToAdd === RATING_TYPES.positive
                      ? styles.SelectedRating
                      : null
                  ].join(' ')}
                  onClick={() =>
                    this.switchSelectedRating(RATING_TYPES.positive)
                  }
                >
                  <ThumbV1 type={'up'} />
                </div>
                <div
                  title={'Change to negative'}
                  className={[
                    styles.RatingToSelectContainer,
                    this.state.selectedRatingToAdd === RATING_TYPES.negative
                      ? styles.SelectedRating
                      : null
                  ].join(' ')}
                  onClick={() =>
                    this.switchSelectedRating(RATING_TYPES.negative)
                  }
                >
                  <ThumbV1 type={'down'} />
                </div>
                <div
                  title={'Change to information'}
                  className={[
                    styles.RatingToSelectContainer,
                    this.state.selectedRatingToAdd === RATING_TYPES.info
                      ? styles.SelectedRating
                      : null
                  ].join(' ')}
                  onClick={() => this.switchSelectedRating(RATING_TYPES.info)}
                >
                  <InfoIcon />
                </div>
              </div>
              <div className={styles.RatingContentPane}>
                <Textarea
                  autoFocus
                  inputRef={tag => (this.ratingTextarea = tag)}
                  minRows={3}
                  maxRows={5}
                  placeholder={'Snippet content...'}
                  value={this.state.ratingContentEdit}
                  onMouseEnter={e => {
                    e.target.focus();
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.target.blur();
                    }
                  }}
                  onChange={e => this.handleRatingContentInputChange(e)}
                  className={[styles.RatingTextarea].join(' ')}
                />
              </div>
            </div>
            {this.state.ratingContentEdit !== '' && (
              <div className={styles.SaveButtonContainer}>
                <ActionButton
                  color="primary"
                  className={classes.button}
                  onClick={() => this.addPieceWithRating()}
                >
                  Save
                </ActionButton>
              </div>
            )}
          </div>
        </Popover>
      </div>
    );

    let droppingRatingIconContainer = this.state.isDraggingRatingIcon && (
      <div
        style={{
          zIndex: 2000,
          position: 'absolute',
          // minWidth: 100,
          left: 0,
          right: 0,
          top: -40,
          height: 40,
          backgroundColor: 'white',
          color: 'black',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
          // borderRadius: '4px'
          // boxShadow: '0 8px 6px -6px lightgray'
        }}
      >
        {this.state.draggingRatingIconType !== RATING_TYPES.positive && (
          <div className={styles.HoverLayerPane}>
            <RatingIconDropLayer
              containerType={RATING_TYPES.positive}
              {...this.props}
            />
          </div>
        )}
        {this.state.draggingRatingIconType !== RATING_TYPES.negative && (
          <div className={styles.HoverLayerPane}>
            <RatingIconDropLayer
              containerType={RATING_TYPES.negative}
              {...this.props}
            />
          </div>
        )}
        {this.state.draggingRatingIconType !== RATING_TYPES.info && (
          <div className={styles.HoverLayerPane}>
            <RatingIconDropLayer
              containerType={RATING_TYPES.info}
              {...this.props}
            />
          </div>
        )}
        <div className={styles.HoverLayerPane}>
          <RatingIconDropLayer containerType={'trash'} {...this.props} />
        </div>
      </div>
    );

    let hideSupportLayer = cell.hide !== true && (
      <div
        style={{
          zIndex:
            this.props.columnIndex === this.props.columnToHide ||
            this.props.rowIndex === this.props.rowToHide
              ? 3000
              : -100,
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          opacity: 0.5,
          backgroundImage:
            this.props.columnIndex === this.props.columnToHide ||
            this.props.rowIndex === this.props.rowToHide
              ? 'linear-gradient(45deg, #ffffff 25%, #e0e0e0 25%, #e0e0e0 50%, #ffffff 50%, #ffffff 75%, #e0e0e0 75%, #e0e0e0 100%)'
              : null,
          backgroundSize:
            this.props.columnIndex === this.props.columnToHide ||
            this.props.rowIndex === this.props.rowToHide
              ? '11.31px 11.31px'
              : null
        }}
      />
    );

    let piecesList = [...cell.pieces];
    if (this.state.addingRatingPieceToCell) {
      piecesList.push({
        pieceId: 'adding',
        rating: this.state.addingRatingPieceRating
      });
    }

    return connectDropTarget(
      <td
        className={styles.RegularCell}
        style={{
          // zoom: isOver ? 3 : null,
          backgroundColor:
            this.props.columnIndex === this.props.columnToDelete
              ? THEME_COLOR.alertBackgroundColor
              : this.props.columnIndex === this.props.columnToSwitchA
              ? '#aed6f1'
              : this.props.columnIndex === this.props.columnToSwitchB
              ? '#89D6E6'
              : this.props.rowIndex === this.props.rowToSwitchA
              ? '#f8c471'
              : this.props.rowIndex === this.props.rowToSwitchB
              ? '#E89339'
              : 'transparent'
        }}
      >
        {hideSupportLayer}
        {addManualRatingPieceContainer}
        {droppingRatingIconContainer}

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
          <div className={styles.EvidenceIconContainer}>
            {piecesList.length > 0 &&
              sortBy(piecesList, ['rating']).map((p, idx) => {
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
                          <RatingIcon
                            editAccess={true}
                            pieceId={p.pieceId}
                            ratingType={p.rating}
                            workspaceId={this.props.workspace.id}
                            cellId={cell.id}
                            cellType={cell.type}
                            switchDraggingRatingIconStatus={
                              this.switchDraggingRatingIconStatus
                            }
                          >
                            {icon}
                          </RatingIcon>
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
                } else if (p.pieceId === 'adding') {
                  return (
                    <div
                      key={`${p.pieceId}-${idx}`}
                      className={styles.AttitudeInTableCell}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Spinner size={'20px'} />
                    </div>
                  );
                } else {
                  return null;
                }
              })}
          </div>

          <div
            className={[
              styles.CellContentEditContainer,
              this.state.contentEdit === '' ? styles.HoverToReveal : null
            ].join(' ')}
            style={{ opacity: isOver || annotation_selected ? 0.2 : null }}
          >
            <div
              className={styles.TextAreaContainer}
              // title={this.state.contentEdit} // switched to material-ui tooltip
            >
              <Tooltip
                disableHoverListener={this.state.contentEdit === ''}
                title={this.state.contentEdit}
                classes={{ tooltip: classes.customWidthTooltip }}
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
              </Tooltip>
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
