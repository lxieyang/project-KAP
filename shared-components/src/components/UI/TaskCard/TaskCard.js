import React, { Component } from 'react';

import { withRouter } from 'react-router-dom';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import fasListUl from '@fortawesome/fontawesome-free-solid/faListUl';
import fasFlagCheckered from '@fortawesome/fontawesome-free-solid/faFlagCheckered';
import fasBookmark from '@fortawesome/fontawesome-free-solid/faBookmark';
import styles from './TaskCard.css';
import moment from 'moment';
import * as FirestoreManager from '../../../firebase/firestore_wrapper';
import { PIECE_COLOR, THEME_COLOR } from '../../../shared/theme';
import { PIECE_TYPES } from '../../../shared/types';
import { copyToClipboard, getTaskLink } from '../../../shared/utilities';

import { withStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardContent from '@material-ui/core/CardContent';
import Star from 'mdi-material-ui/Star';
import StarOutline from 'mdi-material-ui/StarOutline';
import Link from 'mdi-material-ui/Link';
import PencilCircleOutline from 'mdi-material-ui/PencilCircleOutline';
import DeleteCircleOutline from 'mdi-material-ui/DeleteCircleOutline';
import Avatar from '@material-ui/core/Avatar';
import IconButton from '@material-ui/core/IconButton';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import Divider from '@material-ui/core/Divider';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';

import { ToastContainer, toast, Flip } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { CopyToClipboard } from 'react-copy-to-clipboard';

const materialStyles = theme => ({
  card: {
    width: 300,
    height: 'auto',
    margin: '20px 15px'
  },
  headerButtons: {
    transform: 'scale(0.7)'
  },
  media: {
    height: 0,
    paddingTop: '56.25%' // 16:9
  },
  actions: {
    display: 'flex'
  },
  expand: {
    transform: 'rotate(0deg)',
    marginLeft: 'auto',
    transition: theme.transitions.create('transform', {
      duration: theme.transitions.duration.shortest
    })
  },
  expandOpen: {
    transform: 'rotate(180deg)'
  }
});

const StyledCardHeader = withStyles({
  root: {
    padding: '6px 0px'
  },
  avatar: {
    marginRight: 0
  },
  action: {
    margin: 0
  },
  content: {
    fontSize: '1rem'
  },
  title: {
    fontSize: '0.95rem'
  },
  subheader: {
    fontSize: '0.7rem'
  }
})(CardHeader);

const StyledCardContent = withStyles({
  root: {
    padding: '6px 6px 6px 6px'
  }
})(CardContent);

class TaskCard extends Component {
  state = {
    // menu
    anchorEl: null,

    optionCount: 0,
    criterionCount: 0,
    snippetCount: 0
  };

  componentDidMount() {
    this.unsubscribeStatsOption = FirestoreManager.getAllPiecesInTask(
      this.props.task.id
    )
      .where('pieceType', '==', PIECE_TYPES.option)
      .onSnapshot(querySnapshot => {
        this.setState({ optionCount: querySnapshot.docs.length });
      });

    this.unsubscribeStatsCriterion = FirestoreManager.getAllPiecesInTask(
      this.props.task.id
    )
      .where('pieceType', '==', PIECE_TYPES.criterion)
      .onSnapshot(querySnapshot => {
        this.setState({ criterionCount: querySnapshot.docs.length });
      });

    this.unsubscribeStatsSnippet = FirestoreManager.getAllPiecesInTask(
      this.props.task.id
    )
      .where('pieceType', '==', PIECE_TYPES.snippet)
      .onSnapshot(querySnapshot => {
        this.setState({ snippetCount: querySnapshot.docs.length });
      });
  }

  componentWillUnmount() {
    this.unsubscribeStatsOption();
    this.unsubscribeStatsCriterion();
    this.unsubscribeStatsSnippet();
  }

  handleClick = event => {
    this.setState({ anchorEl: event.currentTarget });
  };

  handleDeleteButtonClicked = (taskId, taskName) => {
    this.props.handleDeleteButtonClicked(taskId, taskName);
    this.handleClose();
  };

  handleEditTaskNameButtonClicked = (taskId, currentName) => {
    this.handleClose();
    let taskName = prompt('Change the task name to:', currentName);
    if (taskName !== null && taskName !== '' && taskName !== currentName) {
      FirestoreManager.updateTaskName(taskId, taskName);
    }
  };

  handleClose = () => {
    this.setState({ anchorEl: null });
  };

  switchPopoverOpenStatus = () => {
    this.setState(prevState => {
      return { isPopoverOpen: !prevState.isPopoverOpen };
    });
  };

  titleClickedHandler = taskId => {
    // rerouting
    this.props.history.push(`/tasks/${taskId}`);
  };

  toggleTaskStarStatus = (taskId, to) => {
    FirestoreManager.toggleTaskStarStatus(taskId, to);
  };

  getSharableLinkClickedHandler = (taskId, taskName) => {
    this.handleClose();
    toast.success(
      <div>
        Link for <strong>{taskName}</strong> copied to clipboard!
      </div>,
      {
        position: 'top-center',
        autoClose: 2000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: false
      }
    );
  };

  render() {
    const { task, currentTaskId, classes } = this.props;

    const { optionCount, criterionCount, snippetCount, anchorEl } = this.state;
    const open = Boolean(anchorEl);

    return (
      <Card className={[classes.card, styles.TaskCard].join(' ')}>
        <StyledCardHeader
          avatar={
            <IconButton
              title={`${
                task.isStarred ? 'Remove from Starred' : 'Add to Starred'
              }`}
              className={classes.headerButtons}
              onClick={() =>
                this.toggleTaskStarStatus(task.id, !task.isStarred)
              }
            >
              {task.isStarred ? (
                <Star
                  style={{
                    color: THEME_COLOR.starColor
                  }}
                />
              ) : (
                <StarOutline />
              )}
            </IconButton>
          }
          action={
            <React.Fragment>
              <IconButton
                className={classes.headerButtons}
                aria-label="More"
                aria-owns={open ? `${task.id}-menu` : undefined}
                aria-haspopup="true"
                onClick={this.handleClick}
              >
                <MoreVertIcon />
              </IconButton>
              <Menu
                id={`${task.id}-menu`}
                anchorEl={anchorEl}
                open={open}
                onClose={this.handleClose}
                PaperProps={{
                  style: {
                    maxHeight: 200,
                    width: 'auto',
                    fontSize: 12
                  }
                }}
              >
                <MenuItem
                  onClick={() =>
                    this.handleEditTaskNameButtonClicked(task.id, task.name)
                  }
                  style={{ fontSize: 12, padding: '2px 6px' }}
                  className={styles.MenuItem}
                >
                  <PencilCircleOutline
                    className={styles.MenuItemIcon}
                    style={{ width: '16px', height: '16px' }}
                  />{' '}
                  Edit Name
                </MenuItem>
                <CopyToClipboard text={getTaskLink(task.id)}>
                  <MenuItem
                    onClick={() =>
                      this.getSharableLinkClickedHandler(task.id, task.name)
                    }
                    style={{ fontSize: 12, padding: '2px 6px' }}
                    className={styles.MenuItem}
                  >
                    <Link
                      className={styles.MenuItemIcon}
                      style={{ width: '16px', height: '16px' }}
                    />{' '}
                    Get Sharable Link
                  </MenuItem>
                </CopyToClipboard>
                <MenuItem
                  onClick={() =>
                    this.handleDeleteButtonClicked(task.id, task.name)
                  }
                  style={{ fontSize: 12, padding: '2px 6px' }}
                  className={styles.MenuItem}
                >
                  <DeleteCircleOutline
                    className={styles.MenuItemIcon}
                    style={{ width: '16px', height: '16px' }}
                  />{' '}
                  Delete
                </MenuItem>
              </Menu>
              <ToastContainer
                style={{ fontSize: '16px' }}
                position="top-center"
                transition={Flip}
                autoClose={2000}
                hideProgressBar
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnVisibilityChange
                pauseOnHover
              />
            </React.Fragment>
          }
          title={
            <div
              className={styles.TaskName}
              title={'Go to this task'}
              onClick={() => this.titleClickedHandler(task.id)}
            >
              {task.name}
            </div>
          }
          subheader={
            task.updateDate
              ? `Updated: ${moment(task.updateDate.toDate()).fromNow()}`
              : ' '
          }
        />

        {optionCount > 0 || criterionCount > 0 || snippetCount > 0 ? (
          <Divider />
        ) : null}

        <StyledCardContent style={{ paddingBottom: '6px' }}>
          <div className={styles.Footer}>
            {snippetCount ? (
              <div className={styles.MetaInfo}>
                <Avatar
                  aria-label="type"
                  style={{
                    backgroundColor: PIECE_COLOR.snippet,
                    width: '18px',
                    height: '18px',
                    color: 'white'
                  }}
                  className={styles.Avatar}
                  onClick={this.handleTypeAvatarClick}
                >
                  <FontAwesomeIcon
                    icon={fasBookmark}
                    className={styles.IconInsideAvatar}
                  />
                </Avatar>
                {snippetCount} snippets
              </div>
            ) : null}

            {optionCount ? (
              <div className={styles.MetaInfo}>
                <Avatar
                  aria-label="type"
                  style={{
                    backgroundColor: PIECE_COLOR.option,
                    width: '18px',
                    height: '18px',
                    color: 'white'
                  }}
                  className={styles.Avatar}
                  onClick={this.handleTypeAvatarClick}
                >
                  <FontAwesomeIcon
                    icon={fasListUl}
                    className={styles.IconInsideAvatar}
                  />
                </Avatar>
                {optionCount} options
              </div>
            ) : null}

            {criterionCount ? (
              <div className={styles.MetaInfo}>
                <Avatar
                  aria-label="type"
                  style={{
                    backgroundColor: PIECE_COLOR.criterion,
                    width: '18px',
                    height: '18px',
                    color: 'white'
                  }}
                  className={styles.Avatar}
                  onClick={this.handleTypeAvatarClick}
                >
                  <FontAwesomeIcon
                    icon={fasFlagCheckered}
                    className={styles.IconInsideAvatar}
                  />
                </Avatar>
                {criterionCount} criteria
              </div>
            ) : null}
          </div>
        </StyledCardContent>

        {/*
        <div className={styles.TaskOngoingStatusContainer}>
          {this.props.taskOngoing ? (
            <div
              title={'In progress...'}
              className={[styles.TaskOngoingBadge, styles.TaskOngoingTrue].join(
                ' '
              )}
            >
              <FontAwesomeIcon icon={fasCircleNotch} />
            </div>
          ) : (
            <div
              title={`Completed!${
                this.props.completionTimestamp !== null
                  ? ` (${moment(this.props.completionTimestamp).fromNow()})`
                  : null
              }`}
              className={[
                styles.TaskOngoingBadge,
                styles.TaskOngoingFalse
              ].join(' ')}
            >
              <FontAwesomeIcon icon={fasCheck} />
            </div>
          )}
        </div>
        */}
      </Card>
    );
  }
}

export default withRouter(withStyles(materialStyles)(TaskCard));
