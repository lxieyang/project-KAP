import React, { Component } from 'react';

import { withRouter } from 'react-router-dom';
import * as appRoutes from '../../../shared/routes';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import fasCircleNotch from '@fortawesome/fontawesome-free-solid/faCircleNotch';
import fasListUl from '@fortawesome/fontawesome-free-solid/faListUl';
import fasFlagCheckered from '@fortawesome/fontawesome-free-solid/faFlagCheckered';
import fasBookmark from '@fortawesome/fontawesome-free-solid/faBookmark';
import fasDiagnoses from '@fortawesome/fontawesome-free-solid/faDiagnoses';
import fasCheck from '@fortawesome/fontawesome-free-solid/faCheck';
import styles from './TaskCard.css';
import moment from 'moment';
import { DragSource, DropTarget } from 'react-dnd';
import * as FirestoreManager from '../../../firebase/firestore_wrapper';
import { PIECE_COLOR, THEME_COLOR } from '../../../shared/theme';
import { PIECE_TYPES } from '../../../shared/types';

import { withStyles } from '@material-ui/core/styles';
import classnames from 'classnames';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardContent from '@material-ui/core/CardContent';
import StarIcon from '@material-ui/icons/Star';
import { Star, StarOutline } from 'mdi-material-ui';
import Avatar from '@material-ui/core/Avatar';
import IconButton from '@material-ui/core/IconButton';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import Divider from '@material-ui/core/Divider';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';

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

  render() {
    const { task, currentTaskId, classes } = this.props;

    const { optionCount, criterionCount, snippetCount, anchorEl } = this.state;
    const open = Boolean(anchorEl);

    return (
      <Card className={[classes.card, styles.TaskCard].join(' ')}>
        <StyledCardHeader
          avatar={
            <IconButton
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
                    width: 80
                  }
                }}
              >
                <MenuItem
                  onClick={() =>
                    this.handleEditTaskNameButtonClicked(task.id, task.name)
                  }
                  style={{
                    padding: '4px 4px',
                    fontSize: '12px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                  className={styles.MenuItem}
                >
                  Edit name
                </MenuItem>
                <MenuItem
                  onClick={() =>
                    this.handleDeleteButtonClicked(task.id, task.name)
                  }
                  style={{
                    padding: '4px 4px',
                    fontSize: '12px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                  className={styles.MenuItem}
                >
                  Delete
                </MenuItem>
              </Menu>
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
