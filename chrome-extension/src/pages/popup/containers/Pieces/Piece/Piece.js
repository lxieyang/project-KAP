import React, { Component } from 'react';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import fasListUl from '@fortawesome/fontawesome-free-solid/faListUl';
import fasFlagCheckered from '@fortawesome/fontawesome-free-solid/faFlagCheckered';
import fasBookmark from '@fortawesome/fontawesome-free-solid/faBookmark';
import * as FirestoreManager from '../../../../../../../shared-components/src/firebase/firestore_wrapper';
import ClampLines from 'react-clamp-lines';
import LinesEllipsis from 'react-lines-ellipsis';
import { PIECE_TYPES } from '../../../../../../../shared-components/src/shared/types';
import { PIECE_COLOR } from '../../../../../../../shared-components/src/shared/theme';
import classesInCSS from './Piece.css';

import classnames from 'classnames';
import { loadCSS } from 'fg-loadcss/src/loadCSS';
import { withStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Collapse from '@material-ui/core/Collapse';
import Avatar from '@material-ui/core/Avatar';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import Button from '@material-ui/core/Button';
import Icon from '@material-ui/core/Icon';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import CommentIcon from '@material-ui/icons/Comment';
import Badge from '@material-ui/core/Badge';
import purple from '@material-ui/core/colors/purple';
import Tooltip from '@material-ui/core/Tooltip';
import { GET_FAVICON_URL_PREFIX } from '../../../../../../../shared-components/src/shared/constants';

import moment from 'moment';

const styles = theme => ({
  cardContent: { padding: '0px' },
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
  iconButtons: {
    padding: '4px'
  },
  iconInIconButtons: {
    width: '16px',
    height: '16px',
    color: 'rgb(187, 187, 187)'
  },
  badge: {
    padding: '3px'
  }
});

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
    expanded: false
  };

  componentDidMount() {
    loadCSS(
      'https://use.fontawesome.com/releases/v5.1.0/css/all.css',
      document.querySelector('#insertion-point-jss')
    );
  }

  handleExpandClick = () => {
    this.setState(prevState => ({ expanded: !prevState.expanded }));
  };

  render() {
    let { piece, classes } = this.props;
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
        <Card className={classesInCSS.PieceContainer}>
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
                  height: '32px'
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
              <div className={classesInCSS.PieceContentBox}>
                {/*<ClampLines
                text={piece.text}
                lines={this.state.expanded ? 1 : 2}
                buttons={false}
              />*/}
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
                      <CommentIcon className={classes.iconInIconButtons} />
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
                    >
                      <DeleteIcon className={classes.iconInIconButtons} />
                    </IconButton>
                  </Tooltip>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <a href={piece.references.url} target="__blank">
                    <img
                      src={GET_FAVICON_URL_PREFIX + piece.references.url}
                      alt={'favicon'}
                      className={classesInCSS.SiteIcon}
                    />
                  </a>
                  <div className={classesInCSS.Moment}>
                    {moment(new Date(piece.updateDate.toDate())).fromNow()}
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                flexBasis: '36px',
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
                <ExpandMoreIcon />
              </IconButton>
            </div>
          </CardContent>

          <Collapse in={this.state.expanded} timeout="auto" unmountOnExit>
            <CardContent className={classes.cardContent}>
              <div className={classesInCSS.OriginalContentContainer}>
                <div
                  className={classesInCSS.HTMLPreview}
                  dangerouslySetInnerHTML={getHTML(piece.html)}
                />
              </div>
            </CardContent>
          </Collapse>
        </Card>
      </React.Fragment>
    );
  }
}

export default withStyles(styles)(Piece);
