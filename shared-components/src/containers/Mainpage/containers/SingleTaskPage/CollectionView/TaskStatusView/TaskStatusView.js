import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { getTaskIdFromPath } from '../../matchPath';
import * as FirestoreManager from '../../../../../../firebase/firestore_wrapper';
import {
  getTaskLink,
  shouldAnonymize,
  getAnonymousAnimalName,
  getEncryptedAuthorId,
  getDecryptedAuthorId
} from '../../../../../../shared/utilities';
import { THEME_COLOR } from '../../../../../../shared/theme';
import styles from './TaskStatusView.css';

import { withStyles } from '@material-ui/core/styles';
import IconButton from '@material-ui/core/IconButton';
import Star from 'mdi-material-ui/Star';
import Chat from 'mdi-material-ui/Chat';
import Link from 'mdi-material-ui/Link';
import StarOutline from 'mdi-material-ui/StarOutline';
import Collapse from '@material-ui/core/Collapse';
import Tooltip from '@material-ui/core/Tooltip';

import { ToastContainer, toast, Flip } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { CopyToClipboard } from 'react-copy-to-clipboard';

import Textarea from 'react-textarea-autosize';
import TaskComments from './TaskComments/TaskComments';

const materialStyles = theme => ({
  iconButtons: {
    padding: '5px'
  },
  iconInIconButtons: {
    width: '20px',
    height: '20px',
    color: 'rgb(200, 200, 200)'
  },
  close: {
    padding: theme.spacing.unit / 2
  }
});

class TaskStatusView extends Component {
  state = {
    task: null,

    // task name edit
    taskNameEdit: '',

    // task editing privilege
    editAccess: false,
    commentAccess: false,

    currentTaskCommentsCount: 0,
    commentsExpanded: false,

    // author detail
    author: null
  };

  componentDidMount() {
    this.keyPress = this.keyPress.bind(this);
    this.updateTask();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.userId !== this.props.userId) {
      this.updateTask();
    }
  }

  componentWillUnmount() {
    if (this.unsubscribeTaskId) this.unsubscribeTaskId();
  }

  setCurrentTaskCommentsCount = count => {
    this.setState({ currentTaskCommentsCount: count });
  };

  toggleCommentsExpandedStatus = () => {
    this.setState(prevState => {
      return {
        commentsExpanded: !prevState.commentsExpanded
      };
    });
  };

  updateTask = () => {
    let taskId = getTaskIdFromPath(this.props.history.location.pathname);
    if (this.unsubscribeTaskId) this.unsubscribeTaskId();
    this.unsubscribeTaskId = FirestoreManager.getTaskById(taskId).onSnapshot(
      snapshot => {
        if (snapshot.exists) {
          let task = { id: snapshot.id, ...snapshot.data() };
          this.setState({
            task,
            taskNameEdit: task.name,
            editAccess: task.creator === FirestoreManager.getCurrentUserId(),
            commentAccess: FirestoreManager.getCurrentUserId() !== null
          });

          FirestoreManager.getUserProfileById(task.creator)
            .get()
            .then(doc => {
              if (doc.exists) {
                let user = doc.data();

                let author = {
                  displayName: user.displayName,
                  photoURL: user.photoURL,
                  email: user.email,
                  uid: user.uid,
                  anonymize: false
                };

                // for Oberlin experiment
                if (
                  shouldAnonymize(
                    user.email,
                    task.creator,
                    FirestoreManager.getCurrentUserId()
                  )
                ) {
                  author.anonymize = true;
                }

                this.setState({ author });
              }
            });
        }
      }
    );
  };

  // also allow Enter to submit
  keyPress(e) {
    // if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
    if (e.key === 'Enter' && !e.shiftKey) {
      this.textarea.blur();
    }
  }

  toggleTaskStarStatus = (taskId, currentStarStatus) => {
    FirestoreManager.toggleTaskStarStatus(taskId, !currentStarStatus);
  };

  handleTaskNameChange = e => {
    this.setState({ taskNameEdit: e.target.value });
  };

  updateTaskName = () => {
    let taskName = this.state.taskNameEdit.trim();
    if (
      taskName !== null &&
      taskName !== '' &&
      taskName !== this.state.task.name
    ) {
      FirestoreManager.updateTaskName(this.state.task.id, taskName);
    }
    this.textarea.scrollTo(0, 0);
  };

  getSharableLinkClickedHandler = taskName => {
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
    const {
      task,
      taskNameEdit,
      editAccess,
      commentAccess,
      author
    } = this.state;
    const { classes } = this.props;

    if (task === null) {
      return null;
    }

    /*
    if (!editAccess) {
      return (
        <React.Fragment>
          <div
            className={styles.ReviewingTaskContainer}
            style={{
              backgroundColor: THEME_COLOR.reviewingTaskBackgroundColor
            }}
          >
            <div className={styles.ReviewingTaskNameContainer}>{task.name}</div>
            {author ? (
              <div className={styles.ReviewingTaskAuthorContainer}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {author.anonymize === false && (
                    <span>
                      Created by {author.displayName} ({author.email})
                    </span>
                  )}
                  {author.anonymize === true && (
                    <span>Created by {author.uid}</span>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </React.Fragment>
      );
    }
    */

    return (
      <div>
        <div
          style={{
            backgroundColor: !editAccess
              ? THEME_COLOR.reviewingTaskBackgroundColor
              : null
          }}
          className={styles.TaskStatusViewContainer}
        >
          <div className={styles.VariousButtonsContainer}>
            {editAccess && (
              <Tooltip
                title={`${
                  task.isStarred ? 'Remove from Starred' : 'Add to Starred'
                }`}
                placement={'bottom'}
              >
                <IconButton
                  aria-label="Star"
                  className={classes.iconButtons}
                  onClick={e =>
                    this.toggleTaskStarStatus(task.id, task.isStarred)
                  }
                >
                  {task.isStarred ? (
                    <Star
                      className={classes.iconInIconButtons}
                      style={{
                        color: THEME_COLOR.starColor
                      }}
                    />
                  ) : (
                    <StarOutline className={classes.iconInIconButtons} />
                  )}
                </IconButton>
              </Tooltip>
            )}
          </div>
          <div
            className={styles.TaskNameContainer}
            title={editAccess ? `Edit task name` : null}
          >
            <Textarea
              inputRef={tag => (this.textarea = tag)}
              minRows={1}
              maxRows={6}
              disabled={!editAccess}
              placeholder={'Add a name'}
              value={taskNameEdit}
              onBlur={() => this.updateTaskName()}
              onKeyDown={this.keyPress}
              onChange={e => this.handleTaskNameChange(e)}
              className={styles.Textarea}
            />
            {author && author.uid !== FirestoreManager.getCurrentUserId() ? (
              <div
                className={styles.ReviewingTaskAuthorContainer}
                style={{ marginLeft: 8 }}
              >
                <div
                  style={{
                    // display: 'flex',
                    // alignItems: 'center',
                    marginBottom: 4
                  }}
                >
                  {author.anonymize === false && (
                    <span>
                      Created by {author.displayName} ({author.email})
                    </span>
                  )}
                  {author.anonymize === true && (
                    <React.Fragment>
                      <div>Created by {getAnonymousAnimalName(author.uid)}</div>
                      <div>({getEncryptedAuthorId(author.uid).toString()})</div>
                    </React.Fragment>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          <div style={{ position: 'relative' }}>
            <Tooltip
              title={
                this.state.currentTaskCommentsCount > 0
                  ? this.state.commentsExpanded
                    ? 'Hide Comments'
                    : 'Show comments'
                  : 'Make comments'
              }
              placement={'bottom'}
            >
              <IconButton
                style={{
                  backgroundColor: this.state.commentsExpanded
                    ? 'rgb(235, 235, 235)'
                    : null
                }}
                aria-label="Comment"
                className={classes.iconButtons}
                onClick={() => this.toggleCommentsExpandedStatus()}
              >
                <Chat className={classes.iconInIconButtons} />
              </IconButton>
            </Tooltip>
            <span
              style={{ color: THEME_COLOR.badgeColor }}
              className={styles.CommentCount}
            >
              {this.state.currentTaskCommentsCount > 0
                ? this.state.currentTaskCommentsCount
                : null}
            </span>
          </div>

          {editAccess && (
            <React.Fragment>
              <Tooltip title={`Get sharable link`} placement={'bottom'}>
                <IconButton
                  aria-label="Share"
                  className={classes.iconButtons}
                  onClick={() =>
                    this.getSharableLinkClickedHandler(taskNameEdit)
                  }
                >
                  <CopyToClipboard text={getTaskLink(this.state.task.id)}>
                    <Link className={classes.iconInIconButtons} />
                  </CopyToClipboard>
                </IconButton>
              </Tooltip>
              <ToastContainer
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
          )}
        </div>
        <Collapse in={this.state.commentsExpanded} timeout="auto">
          <div className={styles.TaskCommentsContainer}>
            <TaskComments
              currentAuthor={FirestoreManager.getCurrentUser()}
              taskId={this.state.task.id}
              commentAccess={commentAccess}
              setCurrentTaskCommentsCount={this.setCurrentTaskCommentsCount}
            />
          </div>
        </Collapse>
      </div>
    );
  }
}

export default withRouter(withStyles(materialStyles)(TaskStatusView));
