/* global chrome */
import React, { Component } from 'react';
import queryString from 'query-string';
import styled from 'styled-components';
import Dropdown from 'react-dropdown'; // https://github.com/fraserxu/react-dropdown
import 'react-dropdown/style.css';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import fasTh from '@fortawesome/fontawesome-free-solid/faTh';

import { withStyles } from '@material-ui/core/styles';
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import ViewGrid from 'mdi-material-ui/ViewGrid';
import Star from 'mdi-material-ui/Star';
import StarOutline from 'mdi-material-ui/StarOutline';
import OpenInNew from 'mdi-material-ui/OpenInNew';
import Tooltip from '@material-ui/core/Tooltip';
import Button from '@material-ui/core/Button';
import Snackbar from '@material-ui/core/Snackbar';
import CloseIcon from '@material-ui/icons/Close';
import Divider from '@material-ui/core/Divider';

import Countdown from 'react-countdown-now';

import { THEME_COLOR } from '../../../../../../shared-components/src/shared/theme';

import * as FirestoreManager from '../../../../../../shared-components/src/firebase/firestore_wrapper';

import classesInCSS from './TaskSwitcher.css';

const styles = theme => ({
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

const TaskSwitcherContainer = styled.div`
  /* background-color: #ccc; */
  box-sizing: border-box;
  width: 100%;
  padding: 5px 5px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
`;

const VariousButtonsContainer = styled.div`
  display: flex;
  align-items: center;
  margin-left: '4px';
`;

const createNewTaskOption = {
  value: 'create-new-task',
  label: 'Create a new task',
  className: styles.CreateNewClassName,
  data: {
    isStarred: false
  }
};

const TaskCreatePrompt = styled.div`
  /* background-color: #ccc; */
  box-sizing: border-box;
  width: 100%;
  height: 100px;
  padding: 0px 30px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

class TaskSwitcher extends Component {
  state = {
    options: [createNewTaskOption],
    currentOptionId: createNewTaskOption.value,

    taskCount: 0,
    tasksLoading: true,

    // snackbar
    open: false,
    timeoutDuration: 6000,
    toDeleteTaskId: '',
    toDeleteTaskLabel: ''
  };

  componentDidMount() {
    this.unsubscribeUserCreatedTasksListener = FirestoreManager.getCurrentUserCreatedTasks()
      .orderBy('updateDate', 'desc')
      .onSnapshot(querySnapshot => {
        // this.setState({ tasksLoading: true });
        let tasks = [createNewTaskOption];
        let taskCount = 0;
        querySnapshot.forEach(function(doc) {
          tasks.push({
            value: doc.id,
            label: doc.data().name,
            data: {
              ...doc.data()
            }
          });
          taskCount += 1;
        });
        this.setState({ options: tasks, taskCount, tasksLoading: false });
      });

    // set up current task listener
    this.unsubscribeUserCurrentTaskIdListener = FirestoreManager.getCurrentUserCurrentTaskId().onSnapshot(
      doc => {
        if (doc.exists) {
          let taskId = doc.data().id;
          this.setState({ currentOptionId: taskId });
          this.props.setCurrentTaskId(taskId);
        }
      },
      error => {
        console.log(error);
      }
    );
  }

  componentWillUnmount() {
    this.unsubscribeUserCreatedTasksListener();
    this.unsubscribeUserCurrentTaskIdListener();
  }

  _onSelect = selectedTask => {
    let prevTaskId = this.state.currentOptionId;
    if (selectedTask.value === createNewTaskOption.value) {
      let taskName = prompt('New task name:');
      if (taskName === null) {
        // cancel button pressed
        setTimeout(() => {
          this.setState({ currentOptionId: prevTaskId });
        }, 5);
      } else if (taskName !== '') {
        FirestoreManager.createTaskWithName(taskName)
          .then(docRef => {
            FirestoreManager.updateCurrentUserCurrentTaskId(docRef.id);
            FirestoreManager.createNewTable({ taskId: docRef.id });
          })
          .catch(error => {
            console.log(error);
            alert(error);
          });
      } else {
        setTimeout(() => {
          this.setState({ currentOptionId: prevTaskId });
        }, 5);
      }
    } else {
      // this.setState({ currentOptionId: selectedTask.value });
      FirestoreManager.updateCurrentUserCurrentTaskId(selectedTask.value);
    }
  };

  createNewTaskButtonClickedHandler = () => {
    let taskName = prompt('New task name:');
    if (taskName !== null && taskName !== '') {
      FirestoreManager.createTaskWithName(taskName)
        .then(docRef => {
          FirestoreManager.updateCurrentUserCurrentTaskId(docRef.id);
          FirestoreManager.createNewTable({ taskId: docRef.id });
        })
        .catch(error => {
          console.log(error);
          alert(error);
        });
    }
  };

  updateTaskName = (taskId, currentName) => {
    let taskName = prompt('Change the task name to:', currentName);
    if (taskName !== null && taskName !== '' && taskName !== currentName) {
      FirestoreManager.updateTaskName(taskId, taskName);
    }
  };

  toggleTaskStarStatus = (taskId, currentStarStatus) => {
    FirestoreManager.toggleTaskStarStatus(taskId, !currentStarStatus);
  };

  // snackbar stuff
  handleDeleteButtonClicked = (taskId, taskName) => {
    if (window.confirm(`Are you sure you want to delete "${taskName}"?`)) {
      this.setState({ open: true });

      this.setState({ toDeleteTaskId: taskId, toDeleteTaskLabel: taskName });
      FirestoreManager.deleteTaskById(taskId);
    }
  };

  handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }

    this.setState({ open: false });
  };

  undoButtonClickedHandler = () => {
    this.setState({ open: false });

    FirestoreManager.reviveTaskById(this.state.toDeleteTaskId);
    setTimeout(() => {
      this.setState({ toDeleteTaskId: '', toDeleteTaskLabel: '' });
    }, 500);
  };

  render() {
    let isProduction = process.env.NODE_ENV === 'production' ? true : false;

    let { classes } = this.props;
    let { tasksLoading } = this.state;
    let matchingTasks = this.state.options.filter(op => {
      return op.value === this.state.currentOptionId;
    });
    let currentTask =
      !tasksLoading && matchingTasks.length !== 0
        ? matchingTasks[0]
        : this.state.options[0];

    return (
      <React.Fragment>
        {!this.state.tasksLoading && this.state.taskCount === 0 ? (
          <TaskCreatePrompt>
            <div>
              Please start by
              <Button
                color="primary"
                onClick={e => this.createNewTaskButtonClickedHandler()}
              >
                creating a new task
              </Button>{' '}
              with a name that indicates what you'll be working on in the next
              few minutes.
            </div>
          </TaskCreatePrompt>
        ) : (
          <TaskSwitcherContainer>
            <Tooltip title="Open Task Detail Page" placement={'bottom'}>
              <IconButton
                aria-label="Open"
                className={classes.iconButtons}
                onClick={() => {
                  chrome.runtime.sendMessage({
                    msg: 'Go_TO_SINGLE_TASK_PAGE',
                    taskId: currentTask.value
                  });
                }}
              >
                <OpenInNew className={classes.iconInIconButtons} />
              </IconButton>
            </Tooltip>
            <Dropdown
              className={classesInCSS.DropdownRoot}
              controlClassName={classesInCSS.DropdownControl}
              placeholderClassName={classesInCSS.DropdownPlaceholder}
              menuClassName={classesInCSS.DropdownMenu}
              options={this.state.options}
              onChange={this._onSelect}
              value={currentTask}
              placeholder="No active task"
            />
            <VariousButtonsContainer>
              <Tooltip
                title={`${
                  currentTask.data.isStarred ? 'Unstar' : 'Star'
                } this task`}
                placement={'bottom'}
              >
                <IconButton
                  aria-label="Star"
                  className={classes.iconButtons}
                  onClick={e =>
                    this.toggleTaskStarStatus(
                      currentTask.value,
                      currentTask.data.isStarred
                    )
                  }
                >
                  {currentTask.data.isStarred ? (
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
              <Tooltip title="Edit task name" placement={'bottom'}>
                <IconButton
                  aria-label="Edit"
                  className={classes.iconButtons}
                  onClick={e =>
                    this.updateTaskName(currentTask.value, currentTask.label)
                  }
                >
                  <EditIcon className={classes.iconInIconButtons} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete this task" placement={'bottom'}>
                <IconButton
                  aria-label="Delete"
                  className={classes.iconButtons}
                  onClick={() =>
                    this.handleDeleteButtonClicked(
                      currentTask.value,
                      currentTask.label
                    )
                  }
                >
                  <DeleteIcon className={classes.iconInIconButtons} />
                </IconButton>
              </Tooltip>
              <Tooltip title="All tasks" placement={'bottom'}>
                <IconButton
                  aria-label="Grid"
                  className={classes.iconButtons}
                  onClick={() => {
                    chrome.runtime.sendMessage({
                      msg: 'Go_TO_ALL_TASKS_PAGE'
                    });
                  }}
                >
                  <ViewGrid className={classes.iconInIconButtons} />
                </IconButton>
              </Tooltip>
            </VariousButtonsContainer>
          </TaskSwitcherContainer>
        )}
        <Snackbar
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'left'
          }}
          open={this.state.open}
          autoHideDuration={8000}
          onClose={this.handleClose}
          ContentProps={{
            'aria-describedby': `message-id-task-switcher`
          }}
          message={
            <span id={`message-id-task-switcher`}>
              {this.state.toDeleteTaskLabel} deleted!
            </span>
          }
          action={[
            <Button
              key="undo"
              color="secondary"
              size="small"
              onClick={e => this.undoButtonClickedHandler()}
            >
              UNDO{' '}
              {/*in{' '}
              <span style={{ margin: '0 0.25rem 0 0.25rem' }}>
                <Countdown
                  date={Date.now() + this.state.timeoutDuration}
                  intervalDelay={0}
                  precision={0}
                  renderer={props => <div>{props.seconds}</div>}
                />
              </span>
              seconds*/}
            </Button>,
            <IconButton
              key="close"
              aria-label="Close"
              color="inherit"
              className={classes.close}
              onClick={this.handleClose}
            >
              <CloseIcon />
            </IconButton>
          ]}
        />
      </React.Fragment>
    );
  }
}

export default withStyles(styles)(TaskSwitcher);
