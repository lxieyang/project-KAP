import React, { Component } from 'react';
import styled from 'styled-components';
import { sortBy, debounce } from 'lodash';
import styles from './RegularCell.css';
import ReactHoverObserver from 'react-hover-observer';
import ThumbV1 from '../../../../../../../../../components/UI/Thumbs/ThumbV1/ThumbV1';

import PieceItem from '../../../../../CollectionView/PiecesView/PieceItem/PieceItem';
import RatingLayer from './RatingLayer/RatingLayer';
import * as FirestoreManager from '../../../../../../../../../firebase/firestore_wrapper';
import { RATING_TYPES } from '../../../../../../../../../shared/types';
import { THEME_COLOR } from '../../../../../../../../../shared/theme';

import ReactTooltip from 'react-tooltip';
import HTMLTooltips from './components/HTMLTooltips';
import { withStyles } from '@material-ui/core/styles';
import { Chat } from 'mdi-material-ui';
import Tooltip from '@material-ui/core/Tooltip';
import IconButton from '@material-ui/core/IconButton';
import Popover from '@material-ui/core/Popover';

import Textarea from 'react-textarea-autosize';
import { ContextMenu, MenuItem, ContextMenuTrigger } from 'react-contextmenu';

// dnd stuff
import { DragSource, DropTarget } from 'react-dnd';
import PropTypes from 'prop-types';

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
  }
});

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

    return connectDropTarget(
      <td
        className={styles.RegularCell}
        style={{
          backgroundColor:
            this.props.columnIndex === this.props.columnToDelete
              ? THEME_COLOR.alertBackgroundColor
              : 'transparent'
        }}
      >
        {commentsActionContainer}

        <div
          className={styles.HoverLayer}
          style={{ zIndex: isOver ? 1000 : -1 }}
        >
          <div className={styles.HoverLayerPane}>
            <RatingLayer ratingType={RATING_TYPES.positive} {...this.props} />
          </div>
          <div className={styles.HoverLayerPane}>
            <RatingLayer ratingType={RATING_TYPES.negative} {...this.props} />
          </div>
        </div>

        {/* regular */}
        <div className={styles.RegularContentContainer}>
          {cell.pieces.length > 0 ? (
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
                              this.removePieceFromCellClickedHandler(
                                e,
                                p.pieceId
                              )
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
                        delayHide={200}
                        id={`${p.pieceId}`}
                        className={styles.TooltipOverAttitude}
                        getContent={() => {
                          return (
                            <ContextMenuTrigger
                              id={`${cell.id}-${p.pieceId}-${idx}-context-menu`}
                              holdToDisplay={-1}
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
          ) : null}

          <div
            className={[
              styles.CellContentEditContainer,
              this.state.contentEdit === '' ? styles.HoverToReveal : null
            ].join(' ')}
          >
            <div className={styles.TextAreaContainer}>
              <Textarea
                disabled={!editAccess}
                inputRef={tag => (this.textarea = tag)}
                minRows={1}
                maxRows={5}
                placeholder={
                  editAccess
                    ? 'Type or drop a snippet card here as evidence'
                    : ''
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
      </td>
    );
  }
}

export default withStyles(materialStyles)(
  DropTarget(['PIECE_ITEM'], dropTarget, collectDrop)(RegularCell)
);
