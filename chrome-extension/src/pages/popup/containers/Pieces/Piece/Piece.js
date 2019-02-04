/* global chrome */
import React, { Component } from 'react';
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
import { PIECE_COLOR } from '../../../../../../../shared-components/src/shared/theme';
import Comment from './Comment/Comment';
import classesInCSS from './Piece.css';

import classnames from 'classnames';
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
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
// import CommentIcon from '@material-ui/icons/Comment';
import { Chat } from 'mdi-material-ui';
import Badge from '@material-ui/core/Badge';
import purple from '@material-ui/core/colors/purple';
import Tooltip from '@material-ui/core/Tooltip';
import Divider from '@material-ui/core/Divider';
import { GET_FAVICON_URL_PREFIX } from '../../../../../../../shared-components/src/shared/constants';
import Spinner from '../../../../../../../shared-components/src/components/UI/Spinner/Spinner';

import moment from 'moment';

const styles = theme => ({
  card: {
    borderRadius: '5px',
    border: '1px solid rgba(151, 151, 151, 0.8)',
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
  }
});

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

class Piece extends Component {
  state = {
    expanded: this.props.idx + 1 <= 2 ? true : false,
    anchorEl: null,
    maxScreenshotHeight: 300,
    screenshot: null,
    screenshotLoading: true,
    displayingScreenshot:
      this.props.piece.shouldUseScreenshot &&
      this.props.piece.annotationType === ANNOTATION_TYPES.Snippet
  };

  handleModalOpen = () => {
    this.setState({ screenshotModalOpen: true });
  };

  handleModalClose = () => {
    this.setState({ screenshotModalOpen: false });
  };

  handleTypeAvatarClick = event => {
    this.setState({ anchorEl: event.currentTarget });
  };

  handleTypeAvatarClose = () => {
    this.setState({ anchorEl: null });
  };

  componentDidMount() {
    FirestoreManager.getScreenshotByPieceId(this.props.piece.id)
      .get()
      .then(doc => {
        if (doc.exists) {
          this.setState({ screenshot: doc.data(), screenshotLoading: false });
        } else {
          this.setState({ screenshot: null, screenshotLoading: false });
        }
      });
  }

  handleExpandClick = () => {
    this.setState(prevState => ({ expanded: !prevState.expanded }));
  };

  deletePieceById = pieceId => {
    console.log('should delete', pieceId);
    FirestoreManager.removePieceById(pieceId);
  };

  screenshotImageClickedHandler = pieceId => {
    console.log('should display screenshot for', pieceId);
    chrome.runtime.sendMessage({
      msg: 'SCREENSHOT_MODAL_SHOULD_DISPLAY',
      pieceId,
      imageDataUrl: this.state.screenshot.imageDataUrl
    });
  };

  render() {
    let { piece, classes, isHovering } = this.props;
    const {
      anchorEl,
      maxScreenshotHeight,
      screenshot,
      screenshotLoading,
      displayingScreenshot
    } = this.state;
    const open = Boolean(anchorEl);

    let color = PIECE_COLOR.snippet;
    let icon = fasBookmark;
    switch (piece.pieceType) {
      case PIECE_TYPES.snippet:
        color = PIECE_COLOR.snippet;
        icon = fasBookmark;
        break;
      case PIECE_TYPES.option:
        color = PIECE_COLOR.option;
        icon = fasListUl;
        break;
      case PIECE_TYPES.criterion:
        color = PIECE_COLOR.criterion;
        icon = fasFlagCheckered;
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
                onClick={this.handleTypeAvatarClick}
              >
                <FontAwesomeIcon
                  icon={icon}
                  className={classesInCSS.IconInsideAvatar}
                />
              </Avatar>
              <Menu
                id="long-menu"
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
                    onClick={this.handleTypeAvatarClose}
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

            <div
              style={{
                flex: '1'
              }}
            >
              <div className={classesInCSS.PieceContentBox}>
                <LinesEllipsis
                  text={piece.text}
                  maxLine={this.state.expanded ? 1 : 2}
                  ellipsis="..."
                  trimRight
                  basedOn="words"
                />
              </div>
              <div className={classesInCSS.InfoActionBar}>
                <div
                  style={{
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <Tooltip title="Comment" placement={'top'}>
                    <IconButton
                      aria-label="Comment"
                      className={classes.iconButtons}
                    >
                      <Chat className={classes.iconInIconButtons} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit" placement={'top'}>
                    <IconButton
                      aria-label="Edit"
                      className={classes.iconButtons}
                    >
                      <EditIcon className={classes.iconInIconButtons} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete" placement={'top'}>
                    <IconButton
                      aria-label="Delete"
                      className={classes.iconButtons}
                      onClick={() => this.deletePieceById(piece.id)}
                    >
                      <DeleteIcon className={classes.iconInIconButtons} />
                    </IconButton>
                  </Tooltip>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Tooltip title="Open the original page" placement={'top'}>
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
                    {moment(new Date(piece.updateDate.toDate())).fromNow()}
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
          <Collapse in={this.state.expanded} timeout="auto" unmountOnExit>
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

          {/* Comment Section */}
          {this.state.expanded ? (
            <div>
              <Comment expanded={true} />
            </div>
          ) : (
            <div>
              <Collapse in={isHovering} timeout="auto" unmountOnExit>
                <Comment expanded={false} />
              </Collapse>
            </div>
          )}
        </Card>
      </React.Fragment>
    );
  }
}

export default withStyles(styles)(Piece);
