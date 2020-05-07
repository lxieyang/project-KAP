import React, { Component } from 'react';
import ReactHoverObserver from 'react-hover-observer';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import fasFlagCheckered from '@fortawesome/fontawesome-free-solid/faFlagCheckered';
import indicator from 'ordinal/indicator';
import ReactTooltip from 'react-tooltip';
import styles from './ColumnHeaderCell.css';

import PieceItem from '../../../../../CollectionView/PiecesView/PieceItem/PieceItem';

import * as FirestoreManager from '../../../../../../../../../firebase/firestore_wrapper';

import { withStyles } from '@material-ui/core/styles';
import IconButton from '@material-ui/core/IconButton';
import Avatar from '@material-ui/core/Avatar';
import DeleteIcon from '@material-ui/icons/Delete';
import Chat from 'mdi-material-ui/Chat';
import Eye from 'mdi-material-ui/Eye';
import EyeOff from 'mdi-material-ui/EyeOff';
import Tooltip from '@material-ui/core/Tooltip';
import Popover from '@material-ui/core/Popover';
import Textarea from 'react-textarea-autosize';
import Button from '@material-ui/core/Button';

import { ContextMenu, MenuItem, ContextMenuTrigger } from 'react-contextmenu';

// dnd stuff
import { DropTarget } from 'react-dnd';
import PropTypes from 'prop-types';
import {
  PIECE_TYPES,
  TABLE_CELL_TYPES,
  ANNOTATION_TYPES
} from '../../../../../../../../../shared/types';
import {
  THEME_COLOR,
  PIECE_COLOR
} from '../../../../../../../../../shared/theme';

import CellComments from '../CellComments/CellComments';
import { getFirstName } from '../../../../../../../../../shared/utilities';

import PieceDropLayer from './PieceDropLayer/PieceDropLayer';

const materialStyles = theme => ({
  iconButtons: {
    padding: '4px'
  },
  iconInIconButtons: {
    width: '14px',
    height: '14px',
    color: 'rgb(187, 187, 187)'
  },
  button: {
    marginTop: 0,
    marginBottom: 0,
    marginRight: 8,
    padding: '1px 4px 1px 4px',
    fontSize: 12
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
    // can't drop if no edit access
    if (!props.editAccess) {
      return false;
    }

    // can't drop if already exist
    const item = monitor.getItem();
    const dropPieceId = item.id;
    const dropPieceCellId = item.cellId;
    const dropPieceCellType = item.cellType;
    const dropPieceCellColumnIndex = item.columnIndex;

    const allPieces = props.pieces;
    let cellPieces = props.cell.pieces
      .filter(
        p => allPieces[p.pieceId] !== undefined && allPieces[p.pieceId] !== null
      )
      .map(p => p.pieceId);

    const pieceIds = props.cell.pieces.map(p => p.pieceId);
    if (pieceIds.indexOf(dropPieceId) !== -1) {
      return false;
    }

    // if (
    //   cellPieces.length === 0 &&
    //   dropPieceCellId !== undefined &&
    //   dropPieceCellType === TABLE_CELL_TYPES.columnHeader
    // ) {
    //   // prevent dropping option from other option cells into this cell
    //   return false;
    //   // TODO: we CANNOT prevent dropping the same option into two option cells if both drops come from the piecesView
    // }

    return true;
  },

  hover(props, monitor, component) {
    const item = monitor.getItem();
    const dropPieceCellId = item.cellId;
    const dropPieceCellType = item.cellType;
    const dropPieceCellColumnIndex = item.columnIndex;

    const allPieces = props.pieces;
    let cellPieces = props.cell.pieces
      .filter(
        p => allPieces[p.pieceId] !== undefined && allPieces[p.pieceId] !== null
      )
      .map(p => p.pieceId);

    if (
      cellPieces.length > 0 &&
      dropPieceCellId !== undefined &&
      dropPieceCellType === TABLE_CELL_TYPES.columnHeader &&
      dropPieceCellColumnIndex !== props.columnIndex &&
      props.columnToSwitchA === -1 &&
      props.columnToSwitchB === -1
    ) {
      // both are from the table, should indicate switch columns
      props.setColumnToSwitch(props.columnIndex, dropPieceCellColumnIndex);
    }
  },

  drop(props, monitor, component) {
    const item = monitor.getItem();
    const dropPieceId = item.id;
    const dropPieceCellId = item.cellId;
    const dropPieceCellType = item.cellType;
    const dropPieceCellColumnIndex = item.columnIndex;

    const allPieces = props.pieces;
    let cellPieces = props.cell.pieces
      .filter(
        p => allPieces[p.pieceId] !== undefined && allPieces[p.pieceId] !== null
      )
      .map(p => p.pieceId);

    if (cellPieces.length === 0 && dropPieceCellId === undefined) {
      // no stuff in this cell, dropping from piecesView
      component.resetPieceInThisCell(dropPieceId);
    } else if (
      cellPieces.length === 0 &&
      dropPieceCellId !== undefined &&
      dropPieceCellType === TABLE_CELL_TYPES.columnHeader
    ) {
      // no stuff in this cell, dropping from other column header cells
      // should switch columns
      FirestoreManager.switchColumnsInTable(
        props.workspace.id,
        props.columnIndex,
        dropPieceCellColumnIndex
      );
    } else if (cellPieces.length > 0 && dropPieceCellId === undefined) {
      // there's existing piece, but dropping on from the pieceView
      // should replace with the new one
      component.resetPieceInThisCell(dropPieceId);
    } else if (
      cellPieces.length > 0 &&
      dropPieceCellId !== undefined &&
      dropPieceCellType === TABLE_CELL_TYPES.columnHeader
    ) {
      // both are from the table, should switch columns
      FirestoreManager.switchColumnsInTable(
        props.workspace.id,
        props.columnIndex,
        dropPieceCellColumnIndex
      );
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

class ColumnHeaderCell extends Component {
  state = {
    contentEdit: this.props.cell.content,

    // comment popover
    anchorEl: null,

    // manual piece id / pieces
    manualPieceId: '',
    manualPieces: {},
    addingManualPiece: false,

    // textarea focus
    textareaFocused: false,

    // dnd support
    isDraggingPiece: false
  };

  static propTypes = {
    // Injected by React DnD:
    connectDropTarget: PropTypes.func.isRequired,
    isOver: PropTypes.bool.isRequired,
    canDrop: PropTypes.bool.isRequired
  };

  switchDraggingPieceStatus = to => {
    this.setState({ isDraggingPiece: to });
  };

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.cell.content !== this.props.cell.content) {
      this.setState({ contentEdit: this.props.cell.content });
    }

    if (prevProps.isOver === true && this.props.isOver === false) {
      // didn't drop and left
      this.props.setColumnToSwitch(-1, -1);
    }
  }

  componentDidMount() {
    this.keyPress = this.keyPress.bind(this);

    setTimeout(() => {
      if (this.textarea) {
        this.textarea.focus();
      }
    }, 50);
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
      this.saveCellContentAsPiece();
    }
  }

  handleCellContentInputChange = e => {
    // e.persist();
    this.setState({ contentEdit: e.target.value });
    // this.saveContentCallback(e);
  };

  saveCellContentAsPiece = () => {
    this.textarea.blur();
    let newPieceContent = this.state.contentEdit;
    if (newPieceContent !== '') {
      setTimeout(() => {
        FirestoreManager.setTableCellContentById(
          this.props.workspace.id,
          this.props.cell.id,
          newPieceContent
        );
        // this.setState({ addingManualPiece: true });

        // go create piece and eventually replace cell content with piece
        FirestoreManager.createPiece(
          {
            text: newPieceContent
          },
          {
            taskId: this.props.taskId
          },
          ANNOTATION_TYPES.Manual,
          PIECE_TYPES.criterion
        ).then(pieceId => {
          this.resetPieceInThisCell(pieceId, true);
        });
      }, 50);
    }
  };

  saveCellContentClickedHandler = e => {
    this.saveCellContentAsPiece();
  };

  cancelEditClickedHandler = () => {
    this.setState({ contentEdit: '' });
  };

  deleteTableColumnByIndex = event => {
    if (window.confirm(`Are you sure you want to delete this column?`)) {
      FirestoreManager.deleteColumnInTableByIndex(
        this.props.workspace.id,
        this.props.columnIndex
      );

      this.props.setColumnToDelete(-1);
    }
  };

  addPieceToThisCell = pieceId => {
    FirestoreManager.addPieceToTableCellById(
      this.props.workspace.id,
      this.props.cell.id,
      pieceId
    );

    // change type to option
    this.changePieceType(pieceId);
  };

  resetPieceInThisCell = (pieceId, manual = false) => {
    FirestoreManager.resetPieceInTableCellById(
      this.props.workspace.id,
      this.props.cell.id,
      pieceId
    )
      .then(() => {
        if (manual) {
          // this.setState({ addingManualPiece: false });
          FirestoreManager.setTableCellContentById(
            this.props.workspace.id,
            this.props.cell.id,
            ''
          );
        }
      })
      .catch(() => {
        if (manual) {
          // this.setState({ addingManualPiece: false });
          FirestoreManager.setTableCellContentById(
            this.props.workspace.id,
            this.props.cell.id,
            ''
          );
        }
      });

    // change type to criterion
    this.changePieceType(pieceId);
  };

  changePieceType = (pieceId, to = PIECE_TYPES.criterion) => {
    FirestoreManager.switchPieceType(pieceId, null, to);
  };

  removePieceFromCellClickedHandler = (e, pieceId) => {
    FirestoreManager.deletePieceInTableCellById(
      this.props.workspace.id,
      this.props.cell.id,
      pieceId
    );
  };

  switchHideStatusOfThisColumn = toStatus => {
    this.props.setColumnToHide(-1);
    FirestoreManager.switchHideColumnStatusInTableByIndex(
      this.props.workspace.id,
      this.props.columnIndex,
      toStatus
    );
  };

  render() {
    const { connectDropTarget, canDrop, isOver } = this.props;
    let {
      classes,
      cell,
      pieces,
      editAccess,
      commentAccess,
      comments,
      commentCount,
      context_objects,
      honestSignals,
      isInDefaultView,
      isInContextView,
      isInThoroughnessView
    } = this.props;
    const { anchorEl } = this.state;
    const open = Boolean(anchorEl);

    if (cell === null || pieces === null) {
      return <td />;
    }

    let hideColumnActionContainer = editAccess && (
      <div className={styles.HideColumnIconContainer}>
        <ReactHoverObserver
          {...{
            onMouseEnter: () => {
              this.props.setColumnToHide(this.props.columnIndex);
            },
            onMouseLeave: () => {
              this.props.setColumnToHide(-1);
            }
          }}
        >
          <div>
            <Tooltip
              title={`${cell.hide === true ? 'Show' : 'Hide'} this column`}
              placement={'top'}
              disableFocusListener={true}
            >
              <IconButton
                className={classes.iconButtons}
                onClick={() =>
                  this.switchHideStatusOfThisColumn(
                    cell.hide === true ? false : true
                  )
                }
              >
                {cell.hide === true ? (
                  <Eye className={classes.iconInIconButtons} />
                ) : (
                  <EyeOff className={classes.iconInIconButtons} />
                )}
              </IconButton>
            </Tooltip>
          </div>
        </ReactHoverObserver>
      </div>
    );

    if (editAccess && cell.hide === true) {
      return (
        <th
          className={styles.ColumnHeaderCell}
          style={{
            backgroundImage:
              'linear-gradient(45deg, #ffffff 25%, #e0e0e0 25%, #e0e0e0 50%, #ffffff 50%, #ffffff 75%, #e0e0e0 75%, #e0e0e0 100%)',
            backgroundSize: '11.31px 11.31px'
          }}
          onClick={e => this.switchHideStatusOfThisColumn(false)}
        >
          {hideColumnActionContainer}
          <div style={{ width: '15px', height: '15px' }} />
        </th>
      );
    }

    let cellPieces = cell.pieces.filter(
      p => pieces[p.pieceId] !== undefined && pieces[p.pieceId] !== null
    );

    let deleteColumnActionContainer = editAccess && (
      <div className={styles.DeleteColumnIconContainer}>
        <ReactHoverObserver
          {...{
            onMouseEnter: () => {
              this.props.setColumnToDelete(this.props.columnIndex);
            },
            onMouseLeave: () => {
              this.props.setColumnToDelete(-1);
            }
          }}
        >
          <div>
            <Tooltip
              title="Delete this column"
              placement={'top'}
              disableFocusListener={true}
            >
              <IconButton
                aria-label="Delete"
                className={classes.iconButtons}
                onClick={() => this.deleteTableColumnByIndex()}
              >
                <DeleteIcon className={classes.iconInIconButtons} />
              </IconButton>
            </Tooltip>
          </div>
        </ReactHoverObserver>
      </div>
    );

    let reorderColumnPromptContainer = (
      <div className={styles.ReorderColumnPromptContainer}>
        {this.props.columnToSwitchA === this.props.columnIndex ? (
          <div className={styles.ReorderPrompt}>
            switch column {this.props.columnToSwitchB}
            <sup>{indicator(this.props.columnToSwitchB)}</sup> and{' '}
            {this.props.columnIndex}
            <sup>{indicator(this.props.columnIndex)}</sup>
          </div>
        ) : (
          <div className={styles.IndexIndicator}>
            {this.props.columnIndex}
            <sup>{indicator(this.props.columnIndex)}</sup>
          </div>
        )}
      </div>
    );

    let commentsFromOthers = comments.filter(
      c => c.authorId !== FirestoreManager.getCurrentUserId()
    );

    let commentTooltipTitle = 'Make a comment';
    if (commentCount > 0) {
      if (commentsFromOthers.length === 1) {
        let authorName = getFirstName(commentsFromOthers[0].authorName);
        commentTooltipTitle = `1 comment from ${authorName}`;
      } else if (commentsFromOthers.length > 1) {
        commentTooltipTitle = `${
          commentsFromOthers.length
        } comments from others`;
      }
    }

    let commentsActionContainer = (
      <div
        className={styles.CommentsContainer}
        style={{
          opacity: commentCount > 0 ? 1 : null,
          display: commentAccess !== true && commentCount === 0 ? 'none' : null
        }}
      >
        {commentCount > 0 ? (
          <React.Fragment>
            <div
              style={{ position: 'relative' }}
              data-tip
              data-for={`${cell.id}-comments`}
            >
              <IconButton aria-label="Comment" className={classes.iconButtons}>
                <Chat className={classes.iconInIconButtons} />
              </IconButton>
              <span
                style={{ color: THEME_COLOR.badgeColor }}
                className={styles.CommentCount}
              >
                {commentCount > 0 ? commentCount : null}
              </span>
            </div>
            <ReactTooltip
              place="bottom"
              type="light"
              effect="solid"
              delayHide={100}
              id={`${cell.id}-comments`}
              className={styles.TooltipOverAttitude}
              getContent={() => {
                return (
                  <CellComments
                    workspaceId={this.props.workspace.id}
                    cellId={cell.id}
                    comments={comments}
                    commentAccess={commentAccess}
                    cellType={cell.type}
                  />
                );
              }}
            />{' '}
          </React.Fragment>
        ) : (
          <React.Fragment>
            <div style={{ position: 'relative' }}>
              <Tooltip
                title={commentTooltipTitle}
                placement={'top'}
                disableFocusListener={true}
              >
                <IconButton
                  aria-label="Comment"
                  className={classes.iconButtons}
                  onClick={e => this.handleCommentClick(e)}
                >
                  <Chat className={classes.iconInIconButtons} />
                </IconButton>
              </Tooltip>

              <Popover
                id={`${cell.id}-comments-popover`}
                open={open}
                anchorEl={anchorEl}
                onClose={this.handleCommentClose}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'left'
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'left'
                }}
              >
                <CellComments
                  workspaceId={this.props.workspace.id}
                  cellId={cell.id}
                  comments={comments}
                  commentAccess={commentAccess}
                  cellType={cell.type}
                />
              </Popover>

              <span
                style={{ color: THEME_COLOR.badgeColor }}
                className={styles.CommentCount}
              >
                {commentCount > 0 ? commentCount : null}
              </span>
            </div>
          </React.Fragment>
        )}
      </div>
    );

    let pieceDropLayerContainer = this.state.isDraggingPiece && (
      <div
        style={{
          position: 'absolute',
          top: -35,
          right: 0,
          left: 0,
          height: 35
        }}
      >
        <div style={{ zIndex: 'auto', width: '100%' }}>
          <PieceDropLayer containerType={'trash'} {...this.props} />
        </div>
      </div>
    );

    let hideSupportLayer = editAccess && cell.hide !== true && (
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

    return connectDropTarget(
      <th
        className={styles.ColumnHeaderCell}
        style={{
          backgroundColor:
            this.props.columnIndex === this.props.columnToDelete
              ? THEME_COLOR.alertBackgroundColor
              : (isOver && canDrop) ||
                this.props.columnIndex === this.props.columnToSwitchA
              ? '#aed6f1'
              : this.props.columnIndex === this.props.columnToSwitchB
              ? '#89D6E6'
              : null
        }}
      >
        {this.props.columnToSwitchA === -1 &&
          this.props.columnToSwitchB === -1 &&
          deleteColumnActionContainer}
        {this.props.columnToSwitchA !== -1 &&
          this.props.columnToSwitchB !== -1 &&
          reorderColumnPromptContainer}
        {hideColumnActionContainer}
        {hideSupportLayer}
        {commentsActionContainer}
        {pieceDropLayerContainer}

        {cellPieces.length > 0 ? (
          <div className={styles.ColumnHeaderCellContainer}>
            {cellPieces.map((p, idx) => {
              let context_object = context_objects.filter(
                c => c.references.pieceId === p.pieceId
              );
              context_object =
                context_object.length > 0 ? context_object[0] : null;

              return (
                <React.Fragment key={`${p.pieceId}-${idx}`}>
                  <ContextMenuTrigger
                    id={`${cell.id}-context-menu`}
                    holdToDisplay={-1}
                  >
                    <div
                      className={[
                        styles.ColumnHeaderPiecesContainer,
                        this.props.selectedUrls.length === 0 &&
                        this.props.selectedDomains.length === 0 &&
                        this.props.selectedSnippets.length === 0
                          ? styles.Normal
                          : (pieces[p.pieceId].references.url &&
                              (this.props.selectedUrls.indexOf(
                                pieces[p.pieceId].references.url
                              ) !== -1 ||
                                this.props.selectedDomains.includes(
                                  new URL(pieces[p.pieceId].references.url)
                                    .hostname
                                ))) ||
                            this.props.selectedSnippets.includes(p.pieceId)
                          ? styles.Normal
                          : styles.Fade
                      ].join(' ')}
                    >
                      <PieceItem
                        piece={pieces[p.pieceId]}
                        context_object={context_object}
                        editAccess={editAccess}
                        commentAccess={commentAccess}
                        cellId={cell.id}
                        cellType={cell.type}
                        rowIndex={this.props.rowIndex}
                        columnIndex={this.props.columnIndex}
                        openScreenshot={this.props.openScreenshot}
                        switchDraggingPieceStatus={
                          this.switchDraggingPieceStatus
                        }
                        isDemoTask={this.props.isDemoTask}
                        honestSignals={honestSignals}
                        isInDefaultView={isInDefaultView}
                        isInContextView={isInContextView}
                        isInThoroughnessView={isInThoroughnessView}
                      />
                    </div>
                  </ContextMenuTrigger>
                  {editAccess ? (
                    <ContextMenu id={`${cell.id}-context-menu`}>
                      <MenuItem
                        onClick={e =>
                          this.removePieceFromCellClickedHandler(e, p.pieceId)
                        }
                      >
                        Remove from table
                      </MenuItem>
                    </ContextMenu>
                  ) : null}
                </React.Fragment>
              );
            })}
          </div>
        ) : (
          <div className={styles.CellContentContainer}>
            <div
              className={[
                styles.CellContentEditContainer,
                this.state.contentEdit === '' ? styles.HoverToReveal : null
              ].join(' ')}
            >
              <div className={styles.TextAreaContainer}>
                <Avatar
                  aria-label="type"
                  style={{
                    backgroundColor: PIECE_COLOR.criterion,
                    width: '28px',
                    height: '28px',
                    color: 'white',
                    marginRight: '4px',
                    display:
                      !editAccess && this.state.contentEdit === ''
                        ? 'none'
                        : null
                  }}
                  className={styles.Avatar}
                >
                  <FontAwesomeIcon
                    icon={fasFlagCheckered}
                    className={styles.IconInsideAvatar}
                  />
                </Avatar>
                <Textarea
                  disabled={!editAccess}
                  inputRef={tag => (this.textarea = tag)}
                  minRows={2}
                  maxRows={5}
                  placeholder={
                    editAccess
                      ? 'Type or drop a snippet card here to add a criterion'
                      : ''
                  }
                  value={this.state.contentEdit}
                  onKeyDown={this.keyPress}
                  onFocus={() => this.setState({ textareaFocused: true })}
                  onBlur={() => this.setState({ textareaFocused: false })}
                  onChange={e => this.handleCellContentInputChange(e)}
                  className={[
                    styles.Textarea,
                    editAccess ? styles.TextareaEditable : null
                  ].join(' ')}
                />
              </div>

              <div
                className={styles.TextareaActionBar}
                style={{ opacity: this.state.textareaFocused ? 1 : 0 }}
              >
                <ActionButton
                  color="primary"
                  className={classes.button}
                  onClick={() => this.saveCellContentClickedHandler()}
                >
                  Add as a criterion
                </ActionButton>

                <ActionButton
                  color="secondary"
                  className={classes.button}
                  onClick={() => this.cancelEditClickedHandler()}
                >
                  Cancel
                </ActionButton>
              </div>
            </div>
          </div>
        )}
      </th>
    );
  }
}

export default withStyles(materialStyles)(
  DropTarget(['PIECE_ITEM'], dropTarget, collectDrop)(ColumnHeaderCell)
);
