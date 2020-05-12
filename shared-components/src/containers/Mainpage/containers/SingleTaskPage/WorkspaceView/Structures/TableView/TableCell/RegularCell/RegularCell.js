import React, { Component } from 'react';
import { sortBy, debounce } from 'lodash';
import moment from 'moment';
import styles from './RegularCell.css';
import colorAlpha from 'color-alpha';
import Spinner from '../../../../../../../../../components/UI/Spinner/Spinner';
import ThumbV1 from '../../../../../../../../../components/UI/Thumbs/ThumbV1/ThumbV1';
import InfoIcon from '../../../../../../../../../components/UI/Thumbs/InfoIcon/InfoIcon';

import PieceItem from '../../../../../CollectionView/PiecesView/PieceItem/PieceItem';
import RatingLayer from './RatingLayer/RatingLayer';
import * as FirestoreManager from '../../../../../../../../../firebase/firestore_wrapper';
import {
  RATING_TYPES,
  ANNOTATION_TYPES,
  PIECE_TYPES,
  SECTION_TYPES
} from '../../../../../../../../../shared/types';
import {
  THEME_COLOR,
  PIECE_COLOR
} from '../../../../../../../../../shared/theme';

import { GET_FAVICON_URL_PREFIX } from '../../../../../../../../../shared/constants';

import ReactTooltip from 'react-tooltip';
import { withStyles } from '@material-ui/core/styles';
import Chat from 'mdi-material-ui/Chat';
import BookmarkPlus from 'mdi-material-ui/BookmarkPlus';
import Tooltip from '@material-ui/core/Tooltip';
import IconButton from '@material-ui/core/IconButton';
import Popover from '@material-ui/core/Popover';
import Button from '@material-ui/core/Button';

import { FaArrowAltCircleUp, FaCheck, FaCode } from 'react-icons/fa';
import { IoMdTime } from 'react-icons/io';
import { AiFillFire } from 'react-icons/ai';
import { GiSandsOfTime } from 'react-icons/gi';

import Textarea from 'react-textarea-autosize';
import { ContextMenu, MenuItem, ContextMenuTrigger } from 'react-contextmenu';

// dnd stuff
import {
  DropTarget,
  DragSource,
  ConnectDragPreview,
  ConnectDragSource
} from 'react-dnd';
import PropTypes from 'prop-types';

import CellComments from '../CellComments/CellComments';
import {
  getFirstName,
  getFirstNWords
} from '../../../../../../../../../shared/utilities';

import RatingIcon from './components/RatingIcon';
import RatingIconDropLayer from './RatingIconDropLayer/RatingIconDropLayer';

function getRandomDate(from, to) {
  from = from.getTime();
  to = to.getTime();
  return new Date(from + Math.random() * (to - from));
}

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
    maxWidth: 300
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
    FirestoreManager.deletePieceInTableCellById(
      this.props.workspace.id,
      this.props.cell.id,
      pieceId
    );
  };

  switchRatingTypeOfPiece = (e, pieceId, ratingType) => {
    FirestoreManager.switchPieceRatingType(
      this.props.workspace.id,
      this.props.cell.id,
      pieceId,
      ratingType
    );
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
    const { connectDropTarget, canDrop, isOver, context_objects } = this.props;
    let {
      classes,
      cell,
      rowIndex,
      columnIndex,
      pieces,
      editAccess,
      commentAccess,
      comments,
      commentCount,
      honestSignals,
      isInDefaultView,
      isInContextView,
      isInTrustworthinessView,
      isInThoroughnessView
    } = this.props;

    const { anchorEl, ratingAnchorEl } = this.state;
    const open = Boolean(anchorEl);
    const addRatingOpen = Boolean(ratingAnchorEl);

    if (cell === null || pieces === null) {
      return <td />;
    }

    if (editAccess && cell.hide === true) {
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
          <div style={{ width: '15px', height: '15px' }} />
        </td>
      );
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

    let commentsActionContainer = (
      <div
        className={styles.CommentsContainer}
        style={{
          opacity: commentCount > 0 || open ? 1 : null,
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
                  vertical: 'bottom',
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

    let addManualRatingPieceContainer = editAccess && (
      <div
        className={styles.HoverToReveal}
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
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

    let hoverLayerContainer = isOver && (
      <div
        className={styles.HoverLayer}
        style={{ zIndex: isOver ? 1000 : -1, opacity: isOver ? 1 : 0 }}
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
    );

    let droppingRatingIconContainer = this.state.isDraggingRatingIcon && (
      <div
        style={{
          zIndex: 2000,
          position: 'absolute',
          left: 0,
          right: 0,
          top: -80,
          height: 80,
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

    let piecesList = [...cell.pieces];

    if (this.state.addingRatingPieceToCell) {
      piecesList.push({
        pieceId: 'adding',
        rating: this.state.addingRatingPieceRating
      });
    }

    return connectDropTarget(
      <td
        className={[
          styles.RegularCell,
          rowIndex === 1 ? styles.FirstRegularRow : null,
          columnIndex === 1 ? styles.FirstRegularColumn : null
        ].join(' ')}
        style={{
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
              : this.props.isInThoroughnessView &&
                this.props.activeSections.includes(
                  SECTION_TYPES.section_effort
                ) &&
                Object.keys(this.props.cellColors).length > 0 &&
                this.props.cellColors[cell.id] &&
                typeof this.props.cellColors[cell.id] === 'string'
              ? this.props.cellColors[cell.id]
              : 'transparent'
        }}
      >
        {hideSupportLayer}
        {addManualRatingPieceContainer}
        {droppingRatingIconContainer}
        {commentsActionContainer}
        {hoverLayerContainer}

        {/* regular */}
        <div
          className={styles.RegularContentContainer}
          style={{
            transition: 'all 0.1s ease-in',
            opacity: isOver ? 0.3 : null
          }}
        >
          {this.props.isDemoTask && (
            <div
              className={styles.EvidenceIconContainerVariantI}
              style={{
                display: isInDefaultView ? 'flex' : null,
                justifyContent: isInDefaultView ? 'center' : null,
                alignItems: isInDefaultView ? 'center' : null
              }}
            >
              {piecesList.length > 0 &&
                sortBy(piecesList, ['rating']).map((p, idx) => {
                  if (
                    pieces[p.pieceId] !== undefined &&
                    pieces[p.pieceId] !== null
                  ) {
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

                    const piece = pieces[p.pieceId];
                    const pieceName = piece.name;
                    const pieceNameLength = pieceName.split(' ').length;
                    const pieceNameShort =
                      pieceNameLength > 6
                        ? getFirstNWords(6, pieceName)
                        : pieceName;

                    let context_object = context_objects.filter(
                      c => c.references.pieceId === p.pieceId
                    );
                    context_object =
                      context_object.length > 0 ? context_object[0] : null;

                    let popularityNumber = null; // Math.floor(Math.random() * 100);
                    let updateDate = null; // getRandomDate(new Date(2019, 1, 1),new Date(2020, 4, 1));
                    let isRecent = null;
                    let answerURLOnSO = null;
                    let answerAccepted = null;
                    const codeSnippets = piece.codeSnippets;

                    const answerMetaInfo = piece.answerMetaInfo;
                    if (answerMetaInfo) {
                      popularityNumber = answerMetaInfo.answerVoteCount
                        ? parseInt(answerMetaInfo.answerVoteCount, 10)
                        : null;
                      updateDate = answerMetaInfo.answerEditedTime
                        ? new Date(answerMetaInfo.answerEditedTime)
                        : answerMetaInfo.answerCreatedTime
                        ? new Date(answerMetaInfo.answerCreatedTime)
                        : null;
                      isRecent =
                        (new Date() - updateDate) / (1000 * 86400) < 100;
                      answerURLOnSO = answerMetaInfo.answerLink;
                      answerAccepted = answerMetaInfo.answerAccepted;
                    }

                    return (
                      <React.Fragment key={`${p.pieceId}-${idx}`}>
                        <div
                          className={[
                            styles.AttitudeInTableContainerVariantI,
                            this.props.selectedUrls.length === 0 &&
                            this.props.selectedDomains.length === 0 &&
                            this.props.selectedSnippets.length === 0 &&
                            this.props.selectedCells.length === 0
                              ? styles.Normal
                              : (piece.references.url &&
                                  (this.props.selectedUrls.indexOf(
                                    piece.references.url
                                  ) !== -1 ||
                                    this.props.selectedDomains.includes(
                                      new URL(piece.references.url).hostname
                                    ))) ||
                                this.props.selectedSnippets.includes(
                                  p.pieceId
                                ) ||
                                this.props.selectedCells.includes(cell.id)
                              ? styles.Normal
                              : styles.Fade
                          ].join(' ')}
                          style={{
                            backgroundColor:
                              this.props.isInThoroughnessView &&
                              this.props.activeSections.includes(
                                SECTION_TYPES.section_effort
                              ) &&
                              Object.keys(this.props.cellColors).length > 0 &&
                              this.props.cellColors[cell.id] &&
                              typeof this.props.cellColors[cell.id] === 'object'
                                ? this.props.cellColors[cell.id][p.pieceId]
                                : null
                          }}
                        >
                          <div
                            className={styles.AttitudeIconVariantI}
                            data-tip
                            data-for={`${cell.id}-${p.pieceId}`}
                          >
                            {icon}
                          </div>
                          {!isInDefaultView &&
                            this.props.activeSections.length > 0 && (
                              <div style={{ flex: 1, marginLeft: 3 }}>
                                {this.props.activeSections.length > 0 && (
                                  <div className={styles.PieceNameContainer}>
                                    {/* {isInThoroughnessView || isInContextView
                                  ? pieceName
                                  : pieceNameShort} */}
                                    {pieceNameShort}
                                  </div>
                                )}
                                <div className={styles.TagsContainer}>
                                  {honestSignals.sourceDomain &&
                                    (this.props.activeSections.includes(
                                      SECTION_TYPES.section_effort
                                    ) ||
                                      this.props.activeSections.includes(
                                        SECTION_TYPES.section_sources
                                      )) &&
                                    piece.references.url !== false && (
                                      <Tooltip // title={`${
                                        //   new URL(piece.references.url).hostname // }  ---  Click to open`} //   piece.references.pageTitle // title={`${
                                        // }   ---  Click to open`}
                                        title={`
                                  ${
                                    piece.references.pageTitle
                                  }   --- Click to open`}
                                        placement={'top'}
                                      >
                                        <a
                                          href={
                                            answerURLOnSO
                                              ? answerURLOnSO
                                              : piece.references.url
                                          }
                                          target="__blank"
                                          className={styles.TagSpan}
                                        >
                                          <img
                                            src={
                                              GET_FAVICON_URL_PREFIX +
                                              piece.references.url
                                            }
                                            alt={''}
                                          />
                                          <span
                                            style={{
                                              fontSize: 11,
                                              marginLeft: 4
                                            }}
                                          >
                                            {
                                              new URL(piece.references.url)
                                                .hostname
                                            }
                                          </span>
                                        </a>
                                      </Tooltip>
                                    )}
                                  {honestSignals.popularity &&
                                    this.props.activeSections.includes(
                                      SECTION_TYPES.section_snippets
                                    ) &&
                                    popularityNumber !== null && (
                                      <div>
                                        <span
                                          className={styles.TagSpan}
                                          title={`${popularityNumber} up votes`}
                                        >
                                          <FaArrowAltCircleUp
                                            className={[
                                              styles.Icon,
                                              popularityNumber > 0
                                                ? styles.VoteIcon
                                                : styles.VoteIconNegative
                                            ].join(' ')}
                                          />
                                          {popularityNumber} up votes
                                        </span>
                                      </div>
                                    )}
                                  {honestSignals.popularity &&
                                    this.props.activeSections.includes(
                                      SECTION_TYPES.section_snippets
                                    ) &&
                                    answerAccepted === true && (
                                      <div>
                                        <span
                                          className={styles.TagSpan}
                                          title={`Answer accepted by the question asker`}
                                        >
                                          <FaCheck
                                            className={[
                                              styles.Icon,
                                              styles.AcceptedIcon
                                            ].join(' ')}
                                          />
                                          accepted answer
                                        </span>
                                      </div>
                                    )}
                                  {honestSignals.updateTime &&
                                    this.props.activeSections.includes(
                                      SECTION_TYPES.section_snippets
                                    ) &&
                                    updateDate && (
                                      <div>
                                        <span
                                          className={styles.TagSpan}
                                          title={`Updated on ${updateDate.toLocaleDateString()}`}
                                        >
                                          <GiSandsOfTime
                                            className={[
                                              styles.Icon,
                                              styles.TimeIcon
                                            ].join(' ')}
                                          />
                                          updated {moment(updateDate).fromNow()}
                                        </span>
                                      </div>
                                    )}
                                  {/* {honestSignals.captureTime &&
                                  piece.creationDate && (
                                    <span
                                      className={styles.TagSpan}
                                      title={`Collected on ${piece.creationDate
                                        .toDate()
                                        .toLocaleDateString()}`}
                                    >
                                      <IoMdTime
                                        className={[
                                          styles.Icon,
                                          styles.TimeIcon
                                        ].join(' ')}
                                      />
                                      collected{' '}
                                      {moment(
                                        piece.creationDate.toDate()
                                      ).fromNow()}
                                    </span>
                                  )} */}

                                  {honestSignals.code &&
                                    codeSnippets &&
                                    codeSnippets.length > 0 &&
                                    this.props.activeSections.includes(
                                      SECTION_TYPES.section_code
                                    ) && (
                                      <div>
                                        <span
                                          className={styles.TagSpan}
                                          title={`Contains code snippets`}
                                        >
                                          <FaCode
                                            className={[
                                              styles.Icon,
                                              styles.CodeIcon
                                            ].join(' ')}
                                          />{' '}
                                          contains code examples
                                        </span>
                                      </div>
                                    )}
                                </div>
                              </div>
                            )}
                        </div>
                        <ReactTooltip
                          place={'left'}
                          type="light"
                          effect="solid"
                          delayHide={100}
                          id={`${cell.id}-${p.pieceId}`}
                          className={styles.TooltipOverAttitude}
                          getContent={() => {
                            return (
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
                                isDemoTask={this.props.isDemoTask}
                                attitudeIcon={icon}
                                popularityNumber={popularityNumber}
                                updateDate={updateDate}
                                isRecent={isRecent}
                                answerAccepted={answerAccepted}
                                answerURLOnSO={answerURLOnSO}
                                activeSections={this.props.activeSections}
                                isInContextView={isInContextView}
                              />
                            );
                          }}
                        />
                        {/* {!isInDefaultView && idx !== piecesList.length - 1 && (
                          <hr />
                        )} */}
                      </React.Fragment>
                    );
                  } else {
                    return null;
                  }
                })}
            </div>
          )}

          {!this.props.isDemoTask && (
            <div className={styles.EvidenceIconContainer}>
              {piecesList.length > 0 &&
                sortBy(piecesList, ['rating']).map((p, idx) => {
                  if (
                    pieces[p.pieceId] !== undefined &&
                    pieces[p.pieceId] !== null
                  ) {
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
                            className={[styles.AttitudeInTableCell].join(' ')}
                            data-tip
                            data-for={`${cell.id}-${p.pieceId}`}
                          >
                            <RatingIcon
                              editAccess={editAccess}
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
                        {editAccess ? (
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
                                  style={{
                                    width: 20,
                                    height: 20,
                                    marginLeft: 4
                                  }}
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
                                  style={{
                                    width: 20,
                                    height: 20,
                                    marginLeft: 4
                                  }}
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
                                  style={{
                                    width: 20,
                                    height: 20,
                                    marginLeft: 4
                                  }}
                                >
                                  <InfoIcon />
                                </div>
                              </MenuItem>
                            )}

                            <MenuItem divider />

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
                          place="bottom"
                          type="light"
                          effect="solid"
                          delayHide={100}
                          id={`${cell.id}-${p.pieceId}`}
                          className={styles.TooltipOverAttitude}
                          getContent={() => {
                            return (
                              <ContextMenuTrigger
                                id={`${cell.id}-${
                                  p.pieceId
                                }-${idx}-context-menu`}
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
                        <Spinner size={'30px'} />
                      </div>
                    );
                  } else {
                    return null;
                  }
                })}
            </div>
          )}

          {!this.props.isDemoTask && (
            <div
              className={[
                styles.CellContentEditContainer,
                this.state.contentEdit === '' ? styles.HoverToReveal : null
              ].join(' ')}
            >
              <div className={styles.TextAreaContainer}>
                <Tooltip
                  disableHoverListener={this.state.contentEdit === ''}
                  title={this.state.contentEdit}
                  classes={{ tooltip: classes.customWidthTooltip }}
                >
                  <Textarea
                    disabled={!editAccess}
                    inputRef={tag => (this.textarea = tag)}
                    minRows={2}
                    maxRows={4}
                    placeholder={
                      editAccess && piecesList.length === 0
                        ? 'Type some notes as evidence'
                        : ''
                    }
                    value={this.state.contentEdit}
                    onKeyDown={this.keyPress}
                    onBlur={e => this.saveCellContentClickedHandler(e)}
                    onChange={e => this.handleCellContentInputChange(e)}
                    className={[
                      styles.Textarea,
                      editAccess ? styles.TextareaEditable : null
                    ].join(' ')}
                  />
                </Tooltip>
              </div>
            </div>
          )}
        </div>
      </td>
    );
  }
}

export default withStyles(materialStyles)(
  DropTarget(['PIECE_ITEM'], dropTarget, collectDrop)(RegularCell)
);
