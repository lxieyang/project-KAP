import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import styled from 'styled-components';
import moment from 'moment';
import classnames from 'classnames';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import fasListUl from '@fortawesome/fontawesome-free-solid/faListUl';
import fasFlagCheckered from '@fortawesome/fontawesome-free-solid/faFlagCheckered';
import fasBookmark from '@fortawesome/fontawesome-free-solid/faBookmark';
import LinesEllipsis from 'react-lines-ellipsis';
import ContentEditable from 'react-contenteditable';

import { withStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Collapse from '@material-ui/core/Collapse';
import Avatar from '@material-ui/core/Avatar';
import IconButton from '@material-ui/core/IconButton';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import Button from '@material-ui/core/Button';
import Icon from '@material-ui/core/Icon';
import SaveIcon from '@material-ui/icons/Save';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import { Chat } from 'mdi-material-ui';
import Badge from '@material-ui/core/Badge';
import purple from '@material-ui/core/colors/purple';
import Tooltip from '@material-ui/core/Tooltip';
import Divider from '@material-ui/core/Divider';

import Textarea from 'react-textarea-autosize';

import * as FirestoreManager from '../../../../../../../firebase/firestore_wrapper';
import {
  PIECE_TYPES,
  ANNOTATION_TYPES
} from '../../../../../../../shared/types';
import { PIECE_COLOR, THEME_COLOR } from '../../../../../../../shared/theme';
import { GET_FAVICON_URL_PREFIX } from '../../../../../../../shared/constants';
import Spinner from '../../../../../../../components/UI/Spinner/Spinner';
import classesInCSS from './PieceItem.css';

const materialStyles = theme => ({
  card: {
    borderRadius: '5px',
    border: '1px solid rgba(223, 225, 228, 1)',
    boxShadow: '0 0 1px 1px rgba(0,0,0,0.05)',
    padding: '0px',
    marginBottom: '8px'
  },
  cardContent: { paddingBottom: '0px' },
  expand: {
    padding: '6px',
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
    width: '20px',
    height: '20px'
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

class PieceItem extends Component {
  state = {
    expanded: false,

    // edit piece name
    editingPieceName: false,
    pieceName: this.props.piece.name,
    originalExpandedStatus: false,

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

  constructor(props) {
    super(props);
    this.contentEditable = React.createRef();
  }

  componentDidMount() {
    this.keyPress = this.keyPress.bind(this);
    FirestoreManager.getScreenshotById(this.props.piece.id)
      .get()
      .then(doc => {
        if (doc.exists) {
          this.setState({ screenshot: doc.data(), screenshotLoading: false });
        } else {
          this.setState({ screenshot: null, screenshotLoading: false });
        }
      });
    this.unsubscribeAllComments = FirestoreManager.getAllCommentsToPiece(
      this.props.piece.id
    ).onSnapshot(querySnapshot => {
      this.setState({ commentCount: querySnapshot.docs.length });
    });
  }

  componentWillUnmount() {
    this.unsubscribeAllComments();
  }

  // also allow Enter to submit
  keyPress(e) {
    // if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
    if (e.key === 'Enter' && !e.shiftKey) {
      this.savePieceNameClickedHandler();
    }
  }

  // piece name
  editPieceNameClickedHandler = () => {
    let expanded = this.state.expanded;
    this.setState({
      editingPieceName: true,
      expanded: true,
      originalExpandedStatus: expanded
    });
    setTimeout(() => {
      this.textarea.focus();
      this.textarea.setSelectionRange(0, 0);
      this.textarea.scrollTo(0, 0);
    }, 100);
  };

  handlePieceNameInputChange = event => {
    this.setState({
      pieceName: event.target.value
    });
  };

  savePieceNameClickedHandler = () => {
    let expanded = this.state.originalExpandedStatus;
    this.setState({ editingPieceName: false, expanded });
    FirestoreManager.updatePieceName(this.props.piece.id, this.state.pieceName);
  };

  cancelPieceNameEditClickedHandler = () => {
    let expanded = this.state.originalExpandedStatus;
    this.setState({ editingPieceName: false, expanded });
  };

  // expand
  handleExpandClick = () => {
    this.setState(prevState => ({ expanded: !prevState.expanded }));
  };

  expandPiece = () => {
    this.setState({ expanded: true });
  };

  render() {
    let { piece, classes, isHovering } = this.props;
    const {
      maxScreenshotHeight,
      screenshot,
      screenshotLoading,
      displayingScreenshot,
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

    return (
      <React.Fragment>
        <Card className={classes.card}>
          <CardContent
            style={{ display: 'flex', padding: '0px' }}
            className={classes.cardContent}
          >
            <div>
              <Avatar
                aria-label="type"
                style={{
                  backgroundColor: color,
                  width: '32px',
                  height: '32px',
                  color: 'white'
                }}
                className={classesInCSS.Avatar}
              >
                <FontAwesomeIcon
                  icon={icon}
                  className={classesInCSS.IconInsideAvatar}
                />
              </Avatar>
            </div>

            <div
              style={{
                flex: '1'
              }}
            >
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
                  opacity: !this.state.expanded && isHovering ? '1' : '0.5'
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
                  <Tooltip title={`Delete this ${typeText}`} placement={'top'}>
                    <IconButton
                      aria-label="Delete"
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
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Tooltip
                    title={`${piece.references.pageTitle}  ---  Click to open`}
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
                flexBasis: '32px',
                marginLeft: 'auto',
                order: '3',
                paddingTop: '3px'
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
          <Collapse in={this.state.expanded} timeout="auto">
            <div className={classesInCSS.CollapseContainer}>
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
                      <img
                        alt={piece.id}
                        src={screenshot.imageDataUrl}
                        style={{
                          height: `${Math.min(
                            Math.floor(screenshot.dimensions.rectHeight),
                            maxScreenshotHeight
                          )}px`
                        }}
                        onClick={() =>
                          this.screenshotImageClickedHandler(piece.id)
                        }
                      />
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
            </div>
          </Collapse>
        </Card>
      </React.Fragment>
    );
  }
}

export default withRouter(withStyles(materialStyles)(PieceItem));
