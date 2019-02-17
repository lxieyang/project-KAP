import React, { Component } from 'react';
import styled from 'styled-components';
import ReactHoverObserver from 'react-hover-observer';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import fasListUl from '@fortawesome/fontawesome-free-solid/faListUl';
import fasFlagCheckered from '@fortawesome/fontawesome-free-solid/faFlagCheckered';
import fasBookmark from '@fortawesome/fontawesome-free-solid/faBookmark';
import { debounce } from 'lodash';
import styles from './ColumnHeaderCell.css';

import PieceItem from '../../../../../CollectionView/PiecesView/PieceItem/PieceItem';
import Spinner from '../../../../../../../../../components/UI/Spinner/Spinner';

import * as FirestoreManager from '../../../../../../../../../firebase/firestore_wrapper';

import { withStyles } from '@material-ui/core/styles';
import IconButton from '@material-ui/core/IconButton';
import Avatar from '@material-ui/core/Avatar';
import DeleteIcon from '@material-ui/icons/Delete';
import { Chat, CheckCircle, Cancel } from 'mdi-material-ui';
import Tooltip from '@material-ui/core/Tooltip';
import Popover from '@material-ui/core/Popover';
import Textarea from 'react-textarea-autosize';
import Button from '@material-ui/core/Button';

import { ContextMenu, MenuItem, ContextMenuTrigger } from 'react-contextmenu';

// dnd stuff
import { DragSource, DropTarget } from 'react-dnd';
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

    if (
      cellPieces.length === 0 &&
      dropPieceCellId !== undefined &&
      dropPieceCellType === TABLE_CELL_TYPES.columnHeader
    ) {
      // prevent dropping option from other option cells into this cell
      return false;
      // TODO: we CANNOT prevent dropping the same option into two option cells if both drops come from the piecesView
    }

    return true;
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

    if (cellPieces.length === 0) {
      // no stuff in this cell
      component.resetPieceInThisCell(dropPieceId);
    } else if (cellPieces.length > 0 && dropPieceCellId === undefined) {
      // there's existing piece, but dropping on from the pieceView
      component.resetPieceInThisCell(dropPieceId);
    } else if (
      cellPieces.length > 0 &&
      dropPieceCellId !== undefined &&
      dropPieceCellType === TABLE_CELL_TYPES.columnHeader
    ) {
      // both are from the table, should switch columns
      FirestoreManager.switchRowsInTable(
        props.workspace.id,
        props.columnIndex,
        dropPieceCellColumnIndex
      );
    }

    // let pieces = props.cell.pieces.map(p => p.pieceId);
    // let content = props.cell.content;
    // let thereIsContent = content !== undefined && content !== '';
    // if (pieces.length === 0 && !thereIsContent) {
    //   // no stuff in this cell
    //   component.addPieceToThisCell(dropPieceId);
    // } else if (pieces.length > 0 && dropPieceCellId === undefined) {
    //   // there's existing piece, but dropping on from the pieceView
    //   component.resetPieceInThisCell(dropPieceId);
    // } else if (
    //   pieces.length > 0 &&
    //   dropPieceCellId !== undefined &&
    //   dropPieceCellType === TABLE_CELL_TYPES.columnHeader
    // ) {
    //   // both are from the table, should switch rows
    //   FirestoreManager.switchColumnsInTable(
    //     props.workspace.id,
    //     props.columnIndex,
    //     dropPieceCellColumnIndex
    //   );
    // } else if (
    //   pieces.length === 0 &&
    //   thereIsContent &&
    //   dropPieceCellId !== undefined &&
    //   dropPieceCellType === TABLE_CELL_TYPES.columnHeader
    // ) {
    //   // both are from the table, should switch rows
    //   FirestoreManager.switchColumnsInTable(
    //     props.workspace.id,
    //     props.columnIndex,
    //     dropPieceCellColumnIndex
    //   );
    // }

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
    textareaFocused: false
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
    FirestoreManager.deleteColumnInTableByIndex(
      this.props.workspace.id,
      this.props.columnIndex
    );

    this.props.setColumnToDelete(-1);
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

  render() {
    const { connectDropTarget, canDrop, isOver } = this.props;
    let {
      classes,
      cell,
      pieces,
      editAccess,
      commentAccess,
      comments,
      commentCount
    } = this.props;
    const { anchorEl } = this.state;
    const open = Boolean(anchorEl);

    if (cell === null || pieces === null) {
      return <td />;
    }

    let deleteColumnActionContainer = editAccess ? (
      <div className={styles.DeleteColumnIconContainer}>
        {' '}
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
            <Tooltip title="Delete this column" placement={'top'}>
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
    ) : null;

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

    let commentsActionContainer = commentAccess ? (
      <div
        className={styles.CommentsContainer}
        style={{ zIndex: 1000, opacity: commentCount > 0 ? 1 : null }}
      >
        <div style={{ position: 'relative' }}>
          <Tooltip title={commentTooltipTitle} placement={'top'}>
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
      </div>
    ) : null;

    let cellPieces = cell.pieces.filter(
      p => pieces[p.pieceId] !== undefined && pieces[p.pieceId] !== null
    );

    return connectDropTarget(
      <th
        className={styles.ColumnHeaderCell}
        style={{
          backgroundColor:
            this.props.columnIndex === this.props.columnToDelete
              ? THEME_COLOR.alertBackgroundColor
              : isOver && canDrop
              ? '#aed6f1'
              : null
        }}
      >
        {deleteColumnActionContainer}
        {commentsActionContainer}

        {cellPieces.length > 0 ? (
          <div className={styles.ColumnHeaderCellContainer}>
            {cellPieces.map((p, idx) => {
              return (
                <React.Fragment key={`${p.pieceId}-${idx}`}>
                  <ContextMenuTrigger
                    id={`${cell.id}-context-menu`}
                    holdToDisplay={-1}
                  >
                    <div
                      style={{
                        width: '250px',
                        minHeight: '65px'
                      }}
                    >
                      <PieceItem
                        piece={pieces[p.pieceId]}
                        editAccess={editAccess}
                        commentAccess={commentAccess}
                        cellId={cell.id}
                        cellType={cell.type}
                        rowIndex={this.props.rowIndex}
                        columnIndex={this.props.columnIndex}
                        openScreenshot={this.props.openScreenshot}
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
