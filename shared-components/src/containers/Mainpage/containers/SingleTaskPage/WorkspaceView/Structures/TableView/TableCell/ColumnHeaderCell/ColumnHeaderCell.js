import React, { Component } from 'react';
import styled from 'styled-components';
import { debounce } from 'lodash';
import styles from './ColumnHeaderCell.css';

import PieceItem from '../../../../../CollectionView/PiecesView/PieceItem/PieceItem';

import * as FirestoreManager from '../../../../../../../../../firebase/firestore_wrapper';

import { withStyles } from '@material-ui/core/styles';
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import { Chat } from 'mdi-material-ui';
import Tooltip from '@material-ui/core/Tooltip';
import Popover from '@material-ui/core/Popover';
import Textarea from 'react-textarea-autosize';

import { ContextMenu, MenuItem, ContextMenuTrigger } from 'react-contextmenu';

// dnd stuff
import { DragSource, DropTarget } from 'react-dnd';
import PropTypes from 'prop-types';
import {
  PIECE_TYPES,
  TABLE_CELL_TYPES
} from '../../../../../../../../../shared/types';

import CellComments from '../CellComments/CellComments';
import { THEME_COLOR } from '../../../../../../../../../shared/theme';

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
    // can't drop if no edit access
    if (!props.editAccess) {
      return false;
    }

    // can't drop if already exist
    const dropPieceId = monitor.getItem().id;
    const pieceIds = props.cell.pieces.map(p => p.pieceId);
    if (pieceIds.indexOf(dropPieceId) !== -1) {
      return false;
    }

    return true;
  },

  drop(props, monitor, component) {
    const item = monitor.getItem();
    const dropPieceId = item.id;
    const dropPieceCellId = item.cellId;
    const dropPieceCellType = item.cellType;
    const dropPieceCellColumnIndex = item.columnIndex;

    let pieces = props.cell.pieces.map(p => p.pieceId);
    let content = props.cell.content;
    let thereIsContent = content !== undefined && content !== '';
    if (pieces.length === 0 && !thereIsContent) {
      // no stuff in this cell
      component.addPieceToThisCell(dropPieceId);
    } else if (pieces.length > 0 && dropPieceCellId === undefined) {
      // there's existing piece, but dropping on from the pieceView
      component.resetPieceInThisCell(dropPieceId);
    } else if (
      pieces.length > 0 &&
      dropPieceCellId !== undefined &&
      dropPieceCellType === TABLE_CELL_TYPES.columnHeader
    ) {
      // both are from the table, should switch rows
      FirestoreManager.switchColumnsInTable(
        props.workspace.id,
        props.columnIndex,
        dropPieceCellColumnIndex
      );
    } else if (
      pieces.length === 0 &&
      thereIsContent &&
      dropPieceCellId !== undefined &&
      dropPieceCellType === TABLE_CELL_TYPES.columnHeader
    ) {
      // both are from the table, should switch rows
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
    }, 500);
  }

  componentWillUnmount() {}

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

  deleteTableColumnByIndex = event => {
    FirestoreManager.deleteColumnInTableByIndex(
      this.props.workspace.id,
      this.props.columnIndex
    );
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

  resetPieceInThisCell = pieceId => {
    FirestoreManager.resetPieceInTableCellById(
      this.props.workspace.id,
      this.props.cell.id,
      pieceId
    );

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
      commentCount
    } = this.props;
    const { anchorEl } = this.state;
    const open = Boolean(anchorEl);

    if (cell === null || pieces === null) {
      return <td />;
    }

    let deleteColumnActionContainer = editAccess ? (
      <div className={styles.DeleteColumnIconContainer}>
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
    ) : null;

    let commentsActionContainer = commentAccess ? (
      <div
        className={styles.CommentsContainer}
        style={{ zIndex: 1000, opacity: commentCount > 0 ? 0.7 : null }}
        title={'Comments'}
      >
        <div style={{ position: 'relative' }}>
          {/*<Tooltip title="Comments" placement={'top'}>*/}
          <IconButton
            aria-label="Comment"
            className={classes.iconButtons}
            onClick={e => this.handleCommentClick(e)}
          >
            <Chat className={classes.iconInIconButtons} />
          </IconButton>
          {/*</Tooltip>*/}
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

    return connectDropTarget(
      <th
        className={styles.ColumnHeaderCell}
        style={{ backgroundColor: isOver && canDrop ? '#aed6f1' : null }}
      >
        {deleteColumnActionContainer}
        {commentsActionContainer}

        {cell.pieces.length > 0 ? (
          <div
            className={styles.ColumnHeaderCellContainer}
            style={{ backgroundColor: isOver && canDrop ? '#aed6f1' : null }}
          >
            {cell.pieces.map((p, idx) => {
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
            <div className={styles.CellContentEditContainer}>
              <div className={styles.TextAreaContainer}>
                <Textarea
                  inputRef={tag => (this.textarea = tag)}
                  minRows={2}
                  maxRows={10}
                  placeholder={
                    'Type or drop a snippet card here to add a criterion'
                  }
                  value={this.state.contentEdit}
                  onKeyDown={this.keyPress}
                  onBlur={e => this.saveCellContentClickedHandler(e)}
                  onChange={e => this.handleCellContentInputChange(e)}
                  className={styles.Textarea}
                />
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
