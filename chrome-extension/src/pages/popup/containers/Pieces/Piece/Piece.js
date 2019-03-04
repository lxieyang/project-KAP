/* global chrome */
import React, { Component } from 'react';
import { debounce } from 'lodash';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import fasListUl from '@fortawesome/fontawesome-free-solid/faListUl';
import fasFlagCheckered from '@fortawesome/fontawesome-free-solid/faFlagCheckered';
import fasBookmark from '@fortawesome/fontawesome-free-solid/faBookmark';
import * as FirestoreManager from '../../../../../../../shared-components/src/firebase/firestore_wrapper';
import ClampLines from 'react-clamp-lines';
import LinesEllipsis from 'react-lines-ellipsis';
import {
  PIECE_TYPES,
  ANNOTATION_TYPES
} from '../../../../../../../shared-components/src/shared/types';
import {
  PIECE_COLOR,
  THEME_COLOR
} from '../../../../../../../shared-components/src/shared/theme';
import Comments from './Comments/Comments';
import classesInCSS from './Piece.css';

import classnames from 'classnames';
import { withStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Collapse from '@material-ui/core/Collapse';
import Avatar from '@material-ui/core/Avatar';
import IconButton from '@material-ui/core/IconButton';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import Button from '@material-ui/core/Button';
import Icon from '@material-ui/core/Icon';
import SaveIcon from '@material-ui/icons/Save';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import DeleteIcon from '@material-ui/icons/Delete';
import Chat from 'mdi-material-ui/Chat';
import Looks from 'mdi-material-ui/Looks';
import Tooltip from '@material-ui/core/Tooltip';

import Textarea from 'react-textarea-autosize';

import { GET_FAVICON_URL_PREFIX } from '../../../../../../../shared-components/src/shared/constants';
import Spinner from '../../../../../../../shared-components/src/components/UI/Spinner/Spinner';

import moment from 'moment';

// dnd stuff
import {
  DragSource,
  ConnectDragPreview,
  ConnectDragSource,
  DropTarget
} from 'react-dnd';
import PropTypes from 'prop-types';

const styles = theme => ({
  card: {
    borderRadius: '5px',
    border: '1px solid rgba(223, 225, 228, 1)',
    boxShadow: '0 0 1px 1px rgba(0,0,0,0.05)',
    padding: '0px',
    marginBottom: '8px'
  },
  cardContent: { paddingBottom: '0px' },
  expand: {
    padding: '4px',
    transform: 'rotate(0deg)',
    marginLeft: 'auto',
    transition: theme.transitions.create('transform', {
      duration: theme.transitions.duration.shortest
    })
  },
  expandOpen: {
    transform: 'rotate(180deg)'
  },
  expandIcon: {
    width: '16px',
    height: '16px'
  },
  iconButtons: {
    padding: '4px'
  },
  iconInIconButtons: {
    width: '14px',
    height: '14px',
    color: 'rgb(187, 187, 187)'
  },
  badge: {
    padding: '3px'
  },
  close: {
    padding: theme.spacing.unit / 2
  },
  iconSmall: {
    fontSize: 20
  }
});

const ActionButton = withStyles({
  root: {
    minWidth: '0',
    padding: '0px 4px',
    display: 'block',
    margin: 'auto'
  },
  label: {
    textTransform: 'capitalize'
  }
})(Button);

const options = [
  {
    type: PIECE_TYPES.snippet,
    text: 'Snippet',
    icon: fasBookmark,
    color: PIECE_COLOR.snippet
  },
  {
    type: PIECE_TYPES.option,
    text: 'Option',
    icon: fasListUl,
    color: PIECE_COLOR.option
  },
  {
    type: PIECE_TYPES.criterion,
    text: 'Criterion',
    icon: fasFlagCheckered,
    color: PIECE_COLOR.criterion
  }
];

const getHTML = htmls => {
  let htmlString = ``;
  if (htmls !== undefined) {
    for (let html of htmls) {
      htmlString += html;
    }
  }
  return { __html: htmlString };
};

//
//
//
//
//
/* drag and drop */
const dragSource = {
  beginDrag(props) {
    return {
      id: props.piece.id,
      cellId: props.cellId,
      cellType: props.cellType,
      rowIndex: props.rowIndex,
      columnIndex: props.columnIndex
    };
  },
  canDrag(props, monitor) {
    return true;
  },

  endDrag(props, monitor, component) {
    const item = monitor.getDropResult();
    if (item !== null && item.id !== null && item.id !== undefined) {
      // dropped in a table cell
      if (props.inTrashedTab) {
        FirestoreManager.revivePieceById(props.piece.id);
      }
    }
  }
};

const collectDrag = (connect, monitor) => {
  return {
    connectDragSource: connect.dragSource(),
    connectDragPreview: connect.dragPreview(),
    isDragging: monitor.isDragging()
  };
};

class Piece extends Component {
  state = {
    expanded:
      this.props.currentSelectedPieceInTable !== null &&
      this.props.inAllTab === true
        ? true
        : false,

    anchorEl: null,

    // edit piece name
    editingPieceName: false,
    pieceName: this.props.piece.name,
    pieceNameBeforeStartEditing: this.props.piece.name,
    originalExpandedStatus: false,

    // edit piece text
    pieceText: this.props.piece.text,

    // screenshot control
    maxScreenshotHeight: 300,
    screenshot: null,
    screenshotLoading: true,
    displayingScreenshot:
      this.props.piece.shouldUseScreenshot &&
      this.props.piece.annotationType === ANNOTATION_TYPES.Snippet,

    // comment
    commentCount: 0
  };

  static propTypes = {
    // Injected by React DnD:
    connectDragSource: PropTypes.func.isRequired,
    isDragging: PropTypes.bool.isRequired
  };

  componentDidMount() {
    this.keyPress = this.keyPress.bind(this);
    this.unsubscribeScreenshot = FirestoreManager.getScreenshotById(
      this.props.piece.id
    ).onSnapshot(snapshot => {
      if (snapshot.exists) {
        this.setState({
          screenshot: snapshot.data(),
          screenshotLoading: false
        });
      } else {
        this.setState({ screenshot: null, screenshotLoading: false });
      }
    });

    this.unsubscribeAllComments = FirestoreManager.getAllCommentsToPiece(
      this.props.piece.id
    ).onSnapshot(querySnapshot => {
      this.setState({ commentCount: querySnapshot.docs.length });
    });

    this.pieceNameinputCallback = debounce(event => {
      FirestoreManager.updatePieceName(
        this.props.piece.id,
        this.state.pieceName
      );
    }, 1000);

    this.pieceTextInputCallback = debounce(event => {
      FirestoreManager.updatePieceText(
        this.props.piece.id,
        this.state.pieceText
      );
    }, 1000);
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.piece.name !== this.props.piece.name) {
      this.setState({ pieceName: this.props.piece.name });
    }

    if (prevProps.piece.text !== this.props.piece.text) {
      this.setState({ pieceText: this.props.piece.text });
    }
  }

  componentWillUnmount() {
    this.unsubscribeScreenshot();
    this.unsubscribeAllComments();
  }

  // also allow Enter to submit
  keyPress(e) {
    // if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.target.blur();
    }
  }

  // piece name
  editPieceNameClickedHandler = () => {
    let expanded = true; //this.state.expanded;
    let pieceNameBeforeStartEditing = this.state.pieceName;
    this.setState({
      editingPieceName: true,
      expanded: true,
      pieceNameBeforeStartEditing,
      originalExpandedStatus: expanded
    });
    setTimeout(() => {
      this.textarea.focus();
      this.textarea.setSelectionRange(0, 0);
      this.textarea.scrollTo(0, 0);
    }, 100);
  };

  handlePieceNameInputChange = event => {
    event.persist();
    this.setState({
      pieceName: event.target.value
    });
    this.pieceNameinputCallback(event);
  };

  savePieceNameClickedHandler = () => {
    let expanded = this.state.originalExpandedStatus;
    let pieceNameBeforeStartEditing = this.state.pieceNameBeforeStartEditing;
    this.setState({ editingPieceName: false, expanded });
    if (pieceNameBeforeStartEditing !== this.state.pieceName) {
      FirestoreManager.updatePieceName(
        this.props.piece.id,
        this.state.pieceName
      );
    }
  };

  cancelPieceNameEditClickedHandler = () => {
    let expanded = this.state.originalExpandedStatus;
    this.setState({ editingPieceName: false, expanded });
  };

  // piece text
  handlePieceTextInputChange = event => {
    event.persist();
    this.setState({
      pieceText: event.target.value
    });
    this.pieceTextInputCallback(event);
  };

  savePieceTextClickedHandler = () => {
    FirestoreManager.updatePieceText(this.props.piece.id, this.state.pieceText);
  };

  // piece type switch in uncategorized tab
  handleTypeAvatarClick = event => {
    if (this.props.inUncategorizedTab) {
      this.setState({ anchorEl: event.currentTarget });
    }
  };

  handleTypeAvatarClose = () => {
    this.setState({ anchorEl: null });
  };

  switchPieceTypeClickedHandler = (pieceId, originalType, newType) => {
    FirestoreManager.switchPieceType(pieceId, originalType, newType);
    this.handleTypeAvatarClose();
  };

  // expand
  handleExpandClick = e => {
    e.stopPropagation();
    this.setState(prevState => ({ expanded: !prevState.expanded }));
  };

  expandPiece = () => {
    this.setState({ expanded: true });
  };

  // screenshot
  screenshotImageClickedHandler = pieceId => {
    // console.log('should display screenshot for', pieceId);
    chrome.runtime.sendMessage({
      msg: 'SCREENSHOT_MODAL_SHOULD_DISPLAY',
      pieceId,
      imageDataUrl: this.state.screenshot.imageDataUrl
    });
  };

  // comment
  addCommentClickedHandler = () => {
    this.setState({
      expanded: true
    });
  };

  pieceClickedHandler = (e, pieceId, pieceType) => {
    e.stopPropagation();
    if (
      this.props.currentSelectedPieceInPieces === null ||
      this.props.currentSelectedPieceInPieces.pieceId !== pieceId
    ) {
      this.props.setCurrentSelectedPieceInPieces({ pieceId, pieceType });
    } else {
      this.props.setCurrentSelectedPieceInPieces({
        pieceId: null,
        pieceType: null
      });
    }
  };

  render() {
    const { connectDragSource, connectDragPreview, isDragging } = this.props; // dnd

    let { piece, classes, isHovering } = this.props;
    const {
      anchorEl,
      maxScreenshotHeight,
      screenshot,
      screenshotLoading,
      displayingScreenshot,
      commentCount
    } = this.state;

    const open = Boolean(anchorEl);

    let color = PIECE_COLOR.snippet;
    let icon = fasBookmark;
    let typeText = 'snippet';
    switch (piece.pieceType) {
      case PIECE_TYPES.snippet:
        color = PIECE_COLOR.snippet;
        icon = fasBookmark;
        typeText = 'snippet';
        break;
      case PIECE_TYPES.option:
        color = PIECE_COLOR.option;
        icon = fasListUl;
        typeText = 'option';
        break;
      case PIECE_TYPES.criterion:
        color = PIECE_COLOR.criterion;
        icon = fasFlagCheckered;
        typeText = 'criterion';
        break;
      default:
        break;
    }

    return (
      <div
        onClick={e => this.pieceClickedHandler(e, piece.id, piece.pieceType)}
      >
        <React.Fragment>
          <Card
            className={classes.card}
            style={{
              border:
                isDragging ||
                (this.props.currentSelectedPieceInPieces !== null &&
                  this.props.currentSelectedPieceInPieces.pieceId) === piece.id
                  ? '3px solid red'
                  : null
            }}
          >
            <CardContent
              style={{ display: 'flex', padding: '0px', position: 'relative' }}
              className={classes.cardContent}
            >
              {connectDragSource(
                <div style={{ cursor: 'move' }}>
                  <div style={{ marginTop: '8px', marginLeft: '5px' }}>
                    {connectDragPreview(
                      <div>
                        <Avatar
                          aria-label="type"
                          style={{
                            backgroundColor: color,
                            width: '28px',
                            height: '28px',
                            color: 'white'
                          }}
                          className={classesInCSS.Avatar}
                          onClick={this.handleTypeAvatarClick}
                        >
                          <FontAwesomeIcon
                            icon={icon}
                            className={classesInCSS.IconInsideAvatar}
                          />
                        </Avatar>
                      </div>
                    )}
                  </div>

                  <Menu
                    id={`long-menu-${piece.id}`}
                    anchorEl={anchorEl}
                    open={open}
                    onClose={this.handleTypeAvatarClose}
                    PaperProps={{
                      style: {
                        maxHeight: 120,
                        width: 90
                      }
                    }}
                  >
                    {options.map(option => (
                      <MenuItem
                        key={option.text}
                        selected={piece.pieceType === option.type}
                        onClick={e =>
                          this.switchPieceTypeClickedHandler(
                            piece.id,
                            piece.pieceType,
                            option.type
                          )
                        }
                        style={{
                          padding: '4px 4px',
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <Avatar
                          aria-label="type"
                          style={{
                            backgroundColor: option.color,
                            width: '24px',
                            height: '24px',
                            color: 'white',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center'
                          }}
                        >
                          <FontAwesomeIcon
                            icon={option.icon}
                            style={{ fontSize: '12px' }}
                          />
                        </Avatar>
                        &nbsp; {option.text}
                      </MenuItem>
                    ))}
                  </Menu>
                </div>
              )}

              <div
                style={{
                  flex: '1'
                }}
              >
                {' '}
                {this.state.editingPieceName ? (
                  <div className={classesInCSS.PieceNameEditContainer}>
                    <div className={classesInCSS.TextAreaContainer}>
                      <Textarea
                        inputRef={tag => (this.textarea = tag)}
                        minRows={1}
                        maxRows={4}
                        placeholder={'Add a name'}
                        value={this.state.pieceName}
                        onKeyDown={this.keyPress}
                        onBlur={() => this.savePieceNameClickedHandler()}
                        onChange={e => this.handlePieceNameInputChange(e)}
                        className={classesInCSS.Textarea}
                      />
                    </div>
                    {/*
                  <div className={classesInCSS.TextareaActionSection}>
                    <ActionButton
                      color="secondary"
                      size="small"
                      onClick={() => this.cancelPieceNameEditClickedHandler()}
                    >
                      Cancel
                    </ActionButton>
                    <ActionButton
                      color="primary"
                      size="small"
                      onClick={() => this.savePieceNameClickedHandler()}
                    >
                      Save
                    </ActionButton>
                  </div>*/}
                  </div>
                ) : (
                  <div
                    title={`Edit ${typeText} name`}
                    className={classesInCSS.PieceContentBox}
                    onClick={() => this.editPieceNameClickedHandler()}
                  >
                    <LinesEllipsis
                      text={piece.name}
                      maxLine={2}
                      ellipsis="..."
                      trimRight
                      basedOn="words"
                    />
                  </div>
                )}
                <div
                  className={classesInCSS.InfoActionBar}
                  style={{
                    opacity: this.state.expanded || isHovering ? '1' : '0.5'
                  }}
                >
                  <div
                    style={{
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    {!this.state.expanded ? (
                      <div style={{ position: 'relative' }}>
                        <Tooltip title="Make a comment" placement={'top'}>
                          <IconButton
                            aria-label="Comment"
                            className={classes.iconButtons}
                            onClick={() => this.addCommentClickedHandler()}
                          >
                            <Chat className={classes.iconInIconButtons} />
                          </IconButton>
                        </Tooltip>
                        <span
                          style={{ color: THEME_COLOR.badgeColor }}
                          className={classesInCSS.CommentCount}
                        >
                          {commentCount > 0 ? commentCount : null}
                        </span>
                      </div>
                    ) : null}
                    {/*
                  <Tooltip title={`Edit ${typeText} name`} placement={'top'}>
                    <IconButton
                      aria-label="Edit"
                      className={classes.iconButtons}
                      onClick={() => this.editPieceNameClickedHandler()}
                    >
                      <EditIcon className={classes.iconInIconButtons} />
                    </IconButton>
                  </Tooltip>
                  */}
                    {this.props.currentSelectedPieceInTable === null ? (
                      <Tooltip
                        title={`${
                          this.props.inTrashedTab === true
                            ? 'Permanently Delete'
                            : 'Trash'
                        } this ${typeText}`}
                        placement={'top'}
                      >
                        <IconButton
                          aria-label="Trash"
                          className={classes.iconButtons}
                          onClick={() =>
                            this.props.handleDeleteButtonClicked(
                              piece.id,
                              piece.name
                            )
                          }
                        >
                          <DeleteIcon className={classes.iconInIconButtons} />
                        </IconButton>
                      </Tooltip>
                    ) : null}

                    {this.props.inTrashedTab === true ? (
                      <Tooltip
                        title={`Un-trash this ${typeText}`}
                        placement={'top'}
                      >
                        <IconButton
                          aria-label="Revive"
                          className={classes.iconButtons}
                          onClick={() =>
                            this.props.handleReviveButtonClicked(piece.id)
                          }
                        >
                          <Looks className={classes.iconInIconButtons} />
                        </IconButton>
                      </Tooltip>
                    ) : null}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {piece.references.url !== false ? (
                      <Tooltip
                        title={`${
                          piece.references.pageTitle
                        }  ---  Click to open`}
                        placement={'top'}
                      >
                        <a
                          href={piece.references.url}
                          target="__blank"
                          className={classesInCSS.SiteIcon}
                        >
                          <img
                            src={GET_FAVICON_URL_PREFIX + piece.references.url}
                            alt={'favicon'}
                            className={classesInCSS.SiteIcon}
                          />
                        </a>
                      </Tooltip>
                    ) : null}

                    <div className={classesInCSS.Moment}>
                      {piece.creationDate
                        ? moment(piece.creationDate.toDate()).fromNow()
                        : null}
                    </div>
                  </div>
                </div>
              </div>

              <div
                style={{
                  flexBasis: '24px',
                  marginLeft: 'auto',
                  order: '3',
                  paddingTop: '3px',
                  opacity: isHovering ? '1' : '0.3'
                  // position: 'absolute',
                  // top: '4px',
                  // right: '4px',
                  // zIndex: '99999'
                }}
              >
                <IconButton
                  size="small"
                  className={classnames(classes.expand, {
                    [classes.expandOpen]: this.state.expanded
                  })}
                  onClick={this.handleExpandClick}
                  aria-expanded={this.state.expanded}
                  aria-label="Show more"
                >
                  <ExpandMoreIcon className={classes.expandIcon} />
                </IconButton>
              </div>
            </CardContent>

            {/* Original content in collapse */}
            <Collapse
              in={
                this.state.expanded ||
                (isDragging && this.props.cellType === undefined)
              }
              timeout="auto"
              unmountOnExit
            >
              <div className={classesInCSS.CollapseContainer}>
                {piece.annotationType !== ANNOTATION_TYPES.Manual ? (
                  <React.Fragment>
                    {displayingScreenshot ? (
                      screenshotLoading ? (
                        <div
                          style={{
                            width: '100%',
                            height: '200px',
                            display: 'flex',
                            justifyContent: 'space-around',
                            alignItems: 'center'
                          }}
                        >
                          <Spinner size={'30px'} />
                        </div>
                      ) : (
                        <React.Fragment>
                          <div
                            className={classesInCSS.OriginalScreenshotContainer}
                            style={{ maxHeight: `${maxScreenshotHeight}px` }}
                          >
                            {screenshot && (
                              <img
                                alt={piece.id}
                                src={screenshot.imageDataUrl}
                                style={{
                                  height: `${Math.min(
                                    Math.floor(
                                      screenshot.dimensions.rectHeight
                                    ),
                                    maxScreenshotHeight
                                  )}px`
                                }}
                                onClick={() =>
                                  this.screenshotImageClickedHandler(piece.id)
                                }
                              />
                            )}
                          </div>
                        </React.Fragment>
                      )
                    ) : (
                      <div className={classesInCSS.OriginalContentContainer}>
                        <div
                          className={classesInCSS.HTMLPreview}
                          dangerouslySetInnerHTML={getHTML(piece.html)}
                        />
                      </div>
                    )}
                  </React.Fragment>
                ) : (
                  <div
                    className={classesInCSS.TextareaForPieceContentContainer}
                  >
                    <Textarea
                      minRows={1}
                      maxRows={8}
                      placeholder={' '}
                      value={this.state.pieceText}
                      onKeyDown={this.keyPress}
                      onBlur={() => this.savePieceTextClickedHandler()}
                      onChange={e => this.handlePieceTextInputChange(e)}
                      className={classesInCSS.TextareaForPieceContent}
                    />
                  </div>
                )}
              </div>
            </Collapse>

            <div>
              <Comments
                expanded={this.state.expanded}
                expandPiece={this.expandPiece}
                pieceId={piece.id}
                isHovering={isHovering}
              />
            </div>
          </Card>
        </React.Fragment>
      </div>
    );
  }
}

export default withStyles(styles)(
  DragSource('PIECE_ITEM', dragSource, collectDrag)(Piece)
);
