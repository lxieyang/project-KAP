import React, { Component } from 'react';
import { debounce } from 'lodash';
import { withRouter } from 'react-router-dom';
import moment from 'moment';
import classnames from 'classnames';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import fasListUl from '@fortawesome/fontawesome-free-solid/faListUl';
import fasFlagCheckered from '@fortawesome/fontawesome-free-solid/faFlagCheckered';
import fasBookmark from '@fortawesome/fontawesome-free-solid/faBookmark';
import LinesEllipsis from 'react-lines-ellipsis';

import { withStyles } from '@material-ui/core/styles';
import Chip from '@material-ui/core/Chip';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Collapse from '@material-ui/core/Collapse';
import Avatar from '@material-ui/core/Avatar';
import IconButton from '@material-ui/core/IconButton';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import Button from '@material-ui/core/Button';
import DeleteIcon from '@material-ui/icons/Delete';
import Chat from 'mdi-material-ui/Chat';
import Looks from 'mdi-material-ui/Looks';
import Tooltip from '@material-ui/core/Tooltip';
import Switch from '@material-ui/core/Switch';

import { FaArrowAltCircleUp, FaCheck, FaCode } from 'react-icons/fa';
import { IoMdTime, IoMdHand } from 'react-icons/io';
import { AiFillFire } from 'react-icons/ai';
import { GiSandsOfTime } from 'react-icons/gi';

import Textarea from 'react-textarea-autosize';

import axios from 'axios';

import lemmatize from 'wink-lemmatizer';

import * as FirestoreManager from '../../../../../../../firebase/firestore_wrapper';
import {
  PIECE_TYPES,
  ANNOTATION_TYPES,
  TABLE_CELL_TYPES,
  SECTION_TYPES
} from '../../../../../../../shared/types';
import { PIECE_COLOR, THEME_COLOR } from '../../../../../../../shared/theme';
import {
  GET_FAVICON_URL_PREFIX,
  APP_NAME_SHORT
} from '../../../../../../../shared/constants';
import Spinner from '../../../../../../../components/UI/Spinner/Spinner';
import Comments from './Comments/Comments';
import classesInCSS from './PieceItem.css';

// dnd stuff
import {
  DragSource,
  ConnectDragPreview,
  ConnectDragSource,
  DropTarget
} from 'react-dnd';
import PropTypes from 'prop-types';

const materialStyles = theme => ({
  card: {
    borderRadius: '5px',
    border: '1px solid rgba(223, 225, 228, 1)',
    boxShadow: '0 0 1px 1px rgba(0,0,0,0.05)',
    padding: '0px',
    marginBottom: '8px'
  },
  cardContent: { paddingBottom: '3px' },
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
    if (props.switchDraggingPieceStatus) {
      props.switchDraggingPieceStatus(true);
    }
    return {
      id: props.piece.id,
      cellId: props.cellId,
      cellType: props.cellType,
      rowIndex: props.rowIndex,
      columnIndex: props.columnIndex
    };
  },
  canDrag(props, monitor) {
    return props.editAccess ? true : false;
  },

  endDrag(props, monitor, component) {
    if (props.switchDraggingPieceStatus) {
      props.switchDraggingPieceStatus(false);
    }
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

class PieceItem extends Component {
  htmlRef = React.createRef();

  state = {
    expanded: false,

    // edit piece name
    editingPieceName: false,
    pieceName: this.props.piece.name,
    pieceNameBeforeStartEditing: this.props.piece.name,
    originalExpandedStatus: false,

    // edit piece text
    pieceText: this.props.piece.text,

    // no edit access, viewing piece name
    viewPieceNameExpand: false,

    // screenshot control
    maxScreenshotHeight: 250,
    screenshot: null,
    screenshotLoading: true,
    displayingScreenshot:
      this.props.piece.shouldUseScreenshot &&
      this.props.piece.annotationType === ANNOTATION_TYPES.Snippet,

    // context object control
    displayingContext: false,

    // google suggestions control
    optionVsList: [],

    // comment
    commentCount: 0
  };

  static propTypes = {
    // Injected by React DnD:
    connectDragSource: PropTypes.func.isRequired,
    isDragging: PropTypes.bool.isRequired
  };

  switchShouldDisplayScreenshot = e => {
    e.stopPropagation();
    this.setState(prevState => {
      return { displayingScreenshot: !prevState.displayingScreenshot };
    });
  };

  switchShouldDisplayContext = (e, to = null) => {
    if (e) {
      e.stopPropagation();
    }
    if (to !== null) {
      this.setState({ displayingContext: to });
    } else {
      this.setState(prevState => {
        return { displayingContext: !prevState.displayingContext };
      });
    }

    setTimeout(() => {
      this.findingHTMLFocus();
    }, 500);
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

    if (this.props.cellType === TABLE_CELL_TYPES.regularCell) {
      this.setState({ expanded: true });
    }

    // if (
    //   this.props.cellType === TABLE_CELL_TYPES.columnHeader ||
    //   this.props.cellType === TABLE_CELL_TYPES.regularCell ||
    //   this.props.cellType === TABLE_CELL_TYPES.rowHeader
    // ) {
    //   if (this.props.isInContextView) {
    //     this.setState({ expanded: true });
    //     this.switchShouldDisplayContext(null, true);
    //   } else {
    //     this.setState({ expanded: false });
    //     this.switchShouldDisplayContext(null, false);
    //   }
    // }

    if (
      this.props.activeSections.includes(SECTION_TYPES.section_surroundings)
    ) {
      this.setState({ expanded: true });
      this.switchShouldDisplayContext(null, true);
    } else {
      this.setState({ expanded: false });
      this.switchShouldDisplayContext(null, false);
    }

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

    // setTimeout(() => {
    //   this.findingHTMLFocus();
    // }, 10);

    if (this.props.cellType === TABLE_CELL_TYPES.rowHeader) {
      this.updateGoogleSuggestedOptions();
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.piece.name !== this.props.piece.name) {
      this.setState({ pieceName: this.props.piece.name });
    }

    // prevent abuse
    // if (
    //   prevProps.piece.name !== this.props.piece.name ||
    //   this.props.cellType === TABLE_CELL_TYPES.rowHeader
    // ) {
    //   this.updateGoogleSuggestedOptions();
    // }

    if (prevProps.piece.text !== this.props.piece.text) {
      this.setState({ pieceText: this.props.piece.text });
    }

    // if (prevProps.isInContextView !== this.props.isInContextView) {
    //   if (
    //     this.props.cellType === TABLE_CELL_TYPES.columnHeader ||
    //     this.props.cellType === TABLE_CELL_TYPES.regularCell ||
    //     this.props.cellType === TABLE_CELL_TYPES.rowHeader
    //   ) {
    //     if (this.props.isInContextView) {
    //       this.setState({ expanded: true });
    //       this.switchShouldDisplayContext(null, true);
    //     } else {
    //       this.setState({ expanded: false });
    //       this.switchShouldDisplayContext(null, false);
    //     }
    //   }
    // }

    if (prevProps.activeSections !== this.props.activeSections) {
      if (
        this.props.activeSections.includes(SECTION_TYPES.section_surroundings)
      ) {
        this.setState({ expanded: true });
        this.switchShouldDisplayContext(null, true);
      } else {
        this.setState({ expanded: false });
        this.switchShouldDisplayContext(null, false);
      }
    }
  }

  componentWillUnmount() {
    this.unsubscribeScreenshot();
    this.unsubscribeAllComments();
  }

  updateGoogleSuggestedOptions = async () => {
    const lemmatizer = p => {
      return p
        .toLowerCase()
        .split(' ')
        .map(item => lemmatize.noun(item.trim()))
        .join(' ');
    };

    const pieceName = this.props.piece.name.trim();
    let vsList = await axios.get(
      // 'http://localhost:8800/kap-project-nsh-2504/us-central1/getGoogleAutoSuggests',
      'https://us-central1-kap-project-nsh-2504.cloudfunctions.net/getGoogleAutoSuggests',
      {
        params: {
          q: pieceName // this.context.addToOtherOptions({
          //   original: pieceName,
          //   alternatives: lemmatizedOptionVsList
          // });
        }
      }
    );
    // console.log(vsList);
    vsList = vsList.data.list;
    vsList = vsList.map(item => lemmatizer(item.toLowerCase()));
    vsList = vsList.filter(item => item.substr(0, 3) !== 'mpy'); // TODO: get rid of this hack
    vsList = vsList.slice(0, 5);
    let lemmatizedOptionVsList = vsList;

    this.setState({
      optionVsList: lemmatizedOptionVsList
    });

    this.props.addToOtherOptions({
      original: pieceName,
      alternatives: lemmatizedOptionVsList
    });
  };

  findingHTMLFocus = () => {
    const elem = document.querySelector(
      `[id='${this.props.piece.id}-html'] .kap-approx-focus`
    );
    if (elem) {
      // console.log(elem.offsetParent);
      // this.htmlRef.current.scrollTop = elem.offsetTop;
      if (this.htmlRef.current) {
        this.htmlRef.current.scrollBy({
          top: elem.offsetTop,
          left: 0,
          behavior: 'smooth'
        });
      }
    }
  };

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

  toggleViewPieceNameExpandStatus = () => {
    this.setState(prevState => {
      return {
        viewPieceNameExpand: !prevState.viewPieceNameExpand
      };
    });
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

  // screenshot
  screenshotImageClickedHandler = pieceId => {
    this.props.openScreenshot(this.state.screenshot.imageDataUrl);
  };

  // comment
  addCommentClickedHandler = () => {
    this.setState({
      expanded: true
    });
  };

  // expand
  handleExpandClick = e => {
    e.stopPropagation();
    this.setState(prevState => ({ expanded: !prevState.expanded }));
  };

  expandPiece = () => {
    this.setState({ expanded: true });
  };

  render() {
    const { connectDragSource, connectDragPreview, isDragging } = this.props; // dnd

    let {
      piece,
      context_object,
      classes,
      isHovering,
      editAccess,
      commentAccess,
      attitudeIcon,
      popularityNumber,
      updateDate,
      isRecent,
      answerAccepted,
      isInThoroughnessView
    } = this.props;

    const {
      maxScreenshotHeight,
      screenshot,
      screenshotLoading,
      displayingScreenshot,
      displayingContext,
      commentCount
    } = this.state;

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

    let answerURLOnSO = null;
    const answerMetaInfo = piece.answerMetaInfo;
    if (answerMetaInfo) {
      answerURLOnSO = answerMetaInfo.answerLink;
    }

    return connectDragPreview(
      <div>
        <React.Fragment>
          <Card
            className={classes.card}
            style={{
              marginBottom:
                this.props.cellType === TABLE_CELL_TYPES.regularCell
                  ? '0px'
                  : null
            }}
          >
            <CardContent
              style={{ display: 'flex', padding: '0px', paddingBottom: '5px' }}
              className={classes.cardContent}
            >
              {connectDragSource(
                <div style={{ cursor: editAccess ? 'move' : null }}>
                  <Avatar
                    aria-label="type"
                    style={{
                      backgroundColor: color,
                      width: '28px',
                      height: '28px',
                      color: 'white'
                    }}
                    className={classesInCSS.Avatar}
                    onClick={_ => console.log(piece.id)}
                  >
                    <FontAwesomeIcon
                      icon={icon}
                      className={classesInCSS.IconInsideAvatar}
                    />
                  </Avatar>
                </div>
              )}

              <div style={{ flex: '1' }}>
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
                  </div>
                ) : (
                  <div
                    title={
                      (editAccess
                        ? `Edit `
                        : this.state.viewPieceNameExpand
                        ? `Collapse `
                        : `Expand `) + `${typeText} name`
                    }
                    className={classesInCSS.PieceContentBox}
                    style={{
                      wordBreak:
                        this.props.cellType === TABLE_CELL_TYPES.columnHeader
                          ? 'break-word'
                          : null
                    }}
                    onClick={() => {
                      if (editAccess) {
                        this.editPieceNameClickedHandler();
                      } else {
                        this.toggleViewPieceNameExpandStatus();
                      }
                    }}
                  >
                    {editAccess ? (
                      <LinesEllipsis
                        text={piece.name}
                        maxLine={3}
                        ellipsis="..."
                        trimRight
                        basedOn="letters"
                      />
                    ) : this.state.viewPieceNameExpand === false ? (
                      <LinesEllipsis
                        text={piece.name}
                        maxLine={3}
                        ellipsis="..."
                        trimRight
                        basedOn="letters"
                      />
                    ) : (
                      `${piece.name}`
                    )}
                  </div>
                )}
                <div
                  className={classesInCSS.InfoActionBar}
                  // style={{
                  //   opacity:
                  //     this.state.expanded ||
                  //     (!this.state.expanded && isHovering)
                  //       ? '1'
                  //       : '0.5'
                  // }}
                >
                  {this.props.isDemoTask &&
                    this.props.cellType === TABLE_CELL_TYPES.regularCell && (
                      <React.Fragment>
                        <div>
                          {piece.references.url !== false && (
                            <Tooltip
                              title={`${
                                piece.references.pageTitle
                              }  ---  Click to open`}
                              placement={'top'}
                            >
                              <span
                                className={[
                                  classesInCSS.TagSpan,
                                  classesInCSS.LinkContainer
                                ].join(' ')}
                                style={{ backgroundColor: 'transparent' }}
                              >
                                <a
                                  href={
                                    answerURLOnSO
                                      ? answerURLOnSO
                                      : piece.references.url
                                  }
                                  target="__blank"
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center'
                                  }}
                                >
                                  <img
                                    src={
                                      GET_FAVICON_URL_PREFIX +
                                      piece.references.url
                                    }
                                    alt={''}
                                  />
                                  <span>
                                    {new URL(piece.references.url).hostname}
                                  </span>
                                </a>
                              </span>
                            </Tooltip>
                          )}
                          {!this.props.isInDefaultView &&
                            this.props.popularityNumber !== null && (
                              <div>
                                <span className={classesInCSS.TagSpan}>
                                  <FaArrowAltCircleUp
                                    className={[
                                      classesInCSS.Icon,
                                      this.props.popularityNumber > 0
                                        ? classesInCSS.VoteIcon
                                        : classesInCSS.VoteIconNegative
                                    ].join(' ')}
                                  />
                                  {this.props.popularityNumber} up votes
                                </span>
                              </div>
                            )}
                          {!this.props.isInDefaultView &&
                            this.props.answerAccepted === true && (
                              <div>
                                <span className={classesInCSS.TagSpan}>
                                  <FaCheck
                                    className={[
                                      classesInCSS.Icon,
                                      classesInCSS.AcceptedIcon
                                    ].join(' ')}
                                  />
                                  accepted answer
                                </span>
                              </div>
                            )}
                          {!this.props.isInDefaultView &&
                            this.props.updateDate && (
                              <div>
                                <span className={classesInCSS.TagSpan}>
                                  <GiSandsOfTime
                                    className={[
                                      classesInCSS.Icon,
                                      classesInCSS.TimeIcon
                                    ].join(' ')}
                                  />
                                  updated{' '}
                                  {moment(this.props.updateDate).fromNow()}
                                  {/* {this.props.updateDate.toLocaleDateString()} */}
                                </span>
                              </div>
                            )}
                        </div>
                      </React.Fragment>
                    )}

                  {this.props.isDemoTask &&
                    (this.props.cellType === TABLE_CELL_TYPES.rowHeader ||
                      this.props.cellType === TABLE_CELL_TYPES.columnHeader) &&
                    !this.props.isInDefaultView && (
                      <React.Fragment>
                        <div>
                          {piece.references.url !== false &&
                            (this.props.activeSections.includes(
                              SECTION_TYPES.section_sources
                            ) ||
                              this.props.activeSections.includes(
                                SECTION_TYPES.section_effort
                              )) && (
                              <Tooltip
                                title={`${
                                  piece.references.pageTitle
                                }  ---  Click to open`}
                                placement={'top'}
                              >
                                <span
                                  className={[
                                    classesInCSS.TagSpan,
                                    classesInCSS.LinkContainer
                                  ].join(' ')}
                                  style={{ backgroundColor: 'transparent' }}
                                >
                                  <a
                                    href={
                                      answerURLOnSO
                                        ? answerURLOnSO
                                        : piece.references.url
                                    }
                                    target="__blank"
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center'
                                    }}
                                  >
                                    <img
                                      src={
                                        GET_FAVICON_URL_PREFIX +
                                        piece.references.url
                                      }
                                      alt={''}
                                    />
                                    <span>
                                      {new URL(piece.references.url).hostname}
                                    </span>
                                  </a>
                                </span>
                              </Tooltip>
                            )}
                          {this.props.popularityNumber !== null &&
                            this.props.activeSections.includes(
                              SECTION_TYPES.section_snippets
                            ) && (
                              <div>
                                <span className={classesInCSS.TagSpan}>
                                  <FaArrowAltCircleUp
                                    className={[
                                      classesInCSS.Icon,
                                      this.props.popularityNumber > 0
                                        ? classesInCSS.VoteIcon
                                        : classesInCSS.VoteIconNegative
                                    ].join(' ')}
                                  />
                                  {this.props.popularityNumber} up votes
                                </span>
                              </div>
                            )}
                          {this.props.claps !== null &&
                            this.props.activeSections.includes(
                              SECTION_TYPES.section_snippets
                            ) && (
                              <div>
                                <span className={classesInCSS.TagSpan}>
                                  <IoMdHand
                                    className={[classesInCSS.Icon].join(' ')}
                                  />
                                  {this.props.claps} claps
                                </span>
                              </div>
                            )}
                          {this.props.answerAccepted === true &&
                            this.props.activeSections.includes(
                              SECTION_TYPES.section_snippets
                            ) && (
                              <div>
                                <span className={classesInCSS.TagSpan}>
                                  <FaCheck
                                    className={[
                                      classesInCSS.Icon,
                                      classesInCSS.AcceptedIcon
                                    ].join(' ')}
                                  />
                                  accepted answer
                                </span>
                              </div>
                            )}
                          {this.props.updateDate &&
                            this.props.activeSections.includes(
                              SECTION_TYPES.section_snippets
                            ) && (
                              <div>
                                <span className={classesInCSS.TagSpan}>
                                  <GiSandsOfTime
                                    className={[
                                      classesInCSS.Icon,
                                      classesInCSS.TimeIcon
                                    ].join(' ')}
                                  />
                                  updated{' '}
                                  {moment(this.props.updateDate).fromNow()}
                                  {/* {this.props.updateDate.toLocaleDateString()} */}
                                </span>
                              </div>
                            )}
                          {this.props.codeSnippets &&
                            this.props.codeSnippets.length > 0 &&
                            this.props.activeSections.includes(
                              SECTION_TYPES.section_code
                            ) && (
                              <div>
                                <span
                                  className={classesInCSS.TagSpan}
                                  title={`Contains code snippets`}
                                >
                                  <FaCode
                                    className={[
                                      classesInCSS.Icon,
                                      classesInCSS.CodeIcon
                                    ].join(' ')}
                                  />{' '}
                                  contains code examples
                                </span>
                              </div>
                            )}
                        </div>
                      </React.Fragment>
                    )}

                  <div
                    style={{
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    {/* {commentAccess !== undefined && commentAccess ? (
                      <React.Fragment>
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
                      </React.Fragment>
                    ) : null} */}

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
                    {editAccess && this.props.cellId === undefined ? (
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

                    {editAccess && this.props.inTrashedTab === true ? (
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
                    {!this.props.isDemoTask && (
                      <React.Fragment>
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
                              className={classesInCSS.SiteOrigin}
                            >
                              <img
                                src={
                                  GET_FAVICON_URL_PREFIX + piece.references.url
                                }
                                alt={''}
                                className={classesInCSS.SiteIcon}
                              />
                              <span className={classesInCSS.SiteIconText}>
                                {new URL(piece.references.url).hostname}
                              </span>
                            </a>
                          </Tooltip>
                        ) : piece.annotationType === ANNOTATION_TYPES.Manual ? (
                          <span className={classesInCSS.CreatedBadge}>
                            Created
                          </span>
                        ) : null}

                        <div className={classesInCSS.Moment}>
                          {piece.creationDate
                            ? moment(piece.creationDate.toDate()).fromNow()
                            : null}
                        </div>
                      </React.Fragment>
                    )}
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
                }}
              >
                <IconButton
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
                (isDragging && this.props.cellType === undefined) ||
                this.props.cellType === TABLE_CELL_TYPES.regularCell
              }
              timeout="auto"
              unmountOnExit
            >
              <div className={classesInCSS.CollapseContainer}>
                {piece.annotationType !== ANNOTATION_TYPES.Manual ? (
                  <React.Fragment>
                    {!this.props.isDemoTask &&
                      piece.annotationType === ANNOTATION_TYPES.Snippet && (
                        <div>
                          <div
                            onClick={e => e.stopPropagation()}
                            style={{ fontSize: '13px', marginLeft: '4px' }}
                          >
                            <Chip
                              style={{ height: 24 }}
                              label={
                                displayingScreenshot
                                  ? 'Showing image screenshot'
                                  : 'Showing HTML snapshot'
                              }
                            />

                            {piece.shouldUseScreenshot ||
                            screenshot === null ? null : (
                              <Switch
                                onClick={e => e.stopPropagation()}
                                checked={displayingScreenshot}
                                onChange={this.switchShouldDisplayScreenshot}
                              />
                            )}
                          </div>
                        </div>
                      )}

                    {piece.annotationType === ANNOTATION_TYPES.Snippet &&
                    displayingScreenshot ? (
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
                                  // height: `${Math.min(
                                  //   Math.floor(
                                  //     screenshot.dimensions.rectHeight
                                  //   ),
                                  //   maxScreenshotHeight
                                  // )}px`
                                  width: '100%'
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
                      <div
                        className={[
                          classesInCSS.OriginalContentContainer,
                          this.props.cellType ===
                            TABLE_CELL_TYPES.columnHeader ||
                          this.props.cellType === TABLE_CELL_TYPES.rowHeader
                            ? classesInCSS.OriginalContentContainerInTableHeader
                            : null
                        ].join(' ')}
                        ref={this.htmlRef}
                      >
                        <div
                          id={`${piece.id}-html`}
                          className={[classesInCSS.HTMLPreview].join(' ')}
                          dangerouslySetInnerHTML={getHTML(
                            displayingContext && context_object
                              ? context_object.contextHTML
                              : piece.html
                          )}
                        />
                      </div>
                    )}

                    {/* {this.props.isDemoTask &&
                      (piece.annotationType === ANNOTATION_TYPES.Snippet ||
                        piece.annotationType ===
                          ANNOTATION_TYPES.Highlight) && (
                        <div
                          style={{
                            fontWeight: 300
                          }}
                        >
                          <div
                            onClick={e => e.stopPropagation()}
                            style={{ fontSize: '13px', marginLeft: '4px' }}
                          >
                            <Chip
                              style={{ height: 24 }}
                              label={
                                displayingContext && context_object
                                  ? 'Showing snippet context'
                                  : 'Showing captured snippet'
                              }
                            />

                            {context_object && (
                              <Switch
                                onClick={e => e.stopPropagation()}
                                checked={displayingContext}
                                onChange={this.switchShouldDisplayContext}
                              />
                            )}
                          </div>
                        </div>
                      )} */}

                    {this.props.isDemoTask &&
                      !this.props.isInDefaultView &&
                      (piece.annotationType === ANNOTATION_TYPES.Snippet ||
                        piece.annotationType ===
                          ANNOTATION_TYPES.Highlight) && (
                        <div
                          style={{
                            fontWeight: 300,
                            fontStyle: 'italic'
                          }}
                        >
                          <div
                            onClick={e => e.stopPropagation()}
                            style={{
                              fontSize: '11px',
                              marginLeft: '8px',
                              color: '#666'
                            }}
                          >
                            Showing:&nbsp;
                            <input
                              type="radio"
                              id={`${piece.id}-show-captured-snippet`}
                              name={`${piece.id}-switch`}
                              checked={!displayingContext}
                              onChange={this.switchShouldDisplayContext}
                            />
                            <label
                              htmlFor={`${piece.id}-show-captured-snippet`}
                            >
                              snippet
                            </label>
                            &nbsp;
                            {context_object && (
                              <React.Fragment>
                                <input
                                  type="radio"
                                  id={`${piece.id}-show-snippet-context`}
                                  name={`${piece.id}-switch`}
                                  checked={displayingContext}
                                  onChange={this.switchShouldDisplayContext}
                                />
                                <label
                                  htmlFor={`${piece.id}-show-snippet-context`}
                                >
                                  surroundings
                                </label>
                              </React.Fragment>
                            )}
                          </div>
                        </div>
                      )}
                  </React.Fragment>
                ) : (
                  <div
                    className={classesInCSS.TextareaForPieceContentContainer}
                  >
                    {/* <Textarea
                      minRows={1}
                      maxRows={8}
                      placeholder={' '}
                      value={this.state.pieceText}
                      onKeyDown={this.keyPress}
                      onBlur={() => this.savePieceTextClickedHandler()}
                      onChange={e => this.handlePieceTextInputChange(e)}
                      className={classesInCSS.TextareaForPieceContent}
                    /> */}
                    <div
                      className={[
                        classesInCSS.OriginalContentContainer,
                        this.props.cellType === TABLE_CELL_TYPES.columnHeader ||
                        this.props.cellType === TABLE_CELL_TYPES.rowHeader
                          ? classesInCSS.OriginalContentContainerInTableHeader
                          : null
                      ].join(' ')}
                      ref={this.htmlRef}
                    >
                      {context_object && (
                        <div
                          id={`${piece.id}-html`}
                          className={[
                            classesInCSS.HTMLPreview,
                            this.props.cellType ===
                            TABLE_CELL_TYPES.columnHeader
                              ? classesInCSS.InColumnHeader
                              : null
                          ].join(' ')}
                          dangerouslySetInnerHTML={getHTML(
                            context_object.contextHTML
                          )}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Collapse>

            {isInThoroughnessView &&
              this.props.activeSections.includes(
                SECTION_TYPES.section_other_options
              ) &&
              this.state.optionVsList.length > 0 && (
                <div className={classesInCSS.SuggestedOptionsContainer}>
                  <em>Commonly searched for alternatives:</em>
                  <div>
                    {this.state.optionVsList.map((item, idx) => {
                      return (
                        <div className={classesInCSS.ListItem} key={idx}>
                          {item}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            {/* <div>
              <Comments
                commentAccess={commentAccess}
                expanded={this.state.expanded}
                expandPiece={this.expandPiece}
                pieceId={piece.id}
                isHovering={isHovering}
                cellId={this.props.cellId}
                cellType={this.props.cellType}
              />
            </div> */}
          </Card>
        </React.Fragment>
      </div>
    );
  }
}

export default withRouter(
  withStyles(materialStyles)(
    DragSource('PIECE_ITEM', dragSource, collectDrag)(PieceItem)
  )
);
