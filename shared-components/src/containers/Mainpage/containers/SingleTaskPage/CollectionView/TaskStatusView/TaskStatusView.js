import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { getTaskIdFromPath } from '../../matchPath';
import * as FirestoreManager from '../../../../../../firebase/firestore_wrapper';
import { THEME_COLOR } from '../../../../../../shared/theme';
import styles from './TaskStatusView.css';

import { withStyles } from '@material-ui/core/styles';
import IconButton from '@material-ui/core/IconButton';
import { Star, StarOutline } from 'mdi-material-ui';
import Tooltip from '@material-ui/core/Tooltip';

import Textarea from 'react-textarea-autosize';

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

    // author detail
    author: null
  };

  componentDidMount() {
    this.keyPress = this.keyPress.bind(this);
    let taskId = getTaskIdFromPath(this.props.history.location.pathname);
    this.unsubscribeTaskId = FirestoreManager.getTaskById(taskId).onSnapshot(
      snapshot => {
        if (snapshot.exists) {
          let task = { id: snapshot.id, ...snapshot.data() };
          this.setState({
            task,
            taskNameEdit: task.name,
            editAccess: task.creator === FirestoreManager.getCurrentUserId()
          });

          FirestoreManager.getUserProfileById(task.creator)
            .get()
            .then(doc => {
              if (doc.exists) {
                let user = doc.data();
                this.setState({
                  author: {
                    displayName: user.displayName,
                    photoURL: user.photoURL
                  }
                });
              }
            });
        }
      }
    );
  }

  // also allow Enter to submit
  keyPress(e) {
    // if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
    if (e.key === 'Enter' && !e.shiftKey) {
      this.textarea.blur();
    }
  }

  componentWillUnmount() {
    this.unsubscribeTaskId();
  }

  toggleTaskStarStatus = (taskId, currentStarStatus) => {
    FirestoreManager.toggleTaskStarStatus(taskId, !currentStarStatus);
  };

  handleTaskNameChange = e => {
    this.setState({ taskNameEdit: e.target.value });
  };

  updateTaskName = () => {
    let taskName = this.state.taskNameEdit;
    if (
      taskName !== null &&
      taskName !== '' &&
      taskName !== this.state.task.name
    ) {
      FirestoreManager.updateTaskName(this.state.task.id, taskName);
    }
    this.textarea.scrollTo(0, 0);
  };

  render() {
    const { task, taskNameEdit, editAccess, author } = this.state;
    const { classes } = this.props;

    if (task === null) {
      return null;
    }

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
                  Created by {author.displayName}
                </div>
              </div>
            ) : null}
          </div>
        </React.Fragment>
      );
    }

    return (
      <React.Fragment>
        <div className={styles.TaskStatusViewContainer}>
          <div className={styles.VariousButtonsContainer}>
            {editAccess ? (
              <Tooltip
                title={`${task.isStarred ? 'Unstar' : 'Star'}`}
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
            ) : null}
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
          </div>
        </div>
      </React.Fragment>
    );
  }
}

export default withRouter(withStyles(materialStyles)(TaskStatusView));
