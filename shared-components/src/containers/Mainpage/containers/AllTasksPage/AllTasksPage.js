import React, { Component } from 'react';

import TaskGroup from './TaskGroup/TaskGroup';

import LinesEllipsis from 'react-lines-ellipsis';

import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Snackbar from '@material-ui/core/Snackbar';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import Tooltip from '@material-ui/core/Tooltip';
import Fab from '@material-ui/core/Fab';
import AddIcon from '@material-ui/icons/Add';

import Countdown from 'react-countdown-now';

import styles from './AllTasksPage.css';
import * as FirebaseStore from '../../../../firebase/store';
import * as FirestoreManager from '../../../../firebase/firestore_wrapper';

const materialStyles = theme => ({
  close: {
    padding: theme.spacing.unit / 2
  },
  fab: {
    margin: theme.spacing.unit * 2
  }
});

class AllTasksPage extends Component {
  state = {
    tasks: [],
    tasksLoading: true,
    currentTaskId: null,

    // snackbar control
    open: false,
    timeoutDuration: 8000,
    toDeleteTaskId: '',
    toDeleteTaskName: ''
  };

  handleDeleteButtonClicked = (taskId, taskName) => {
    if (window.confirm(`Are you sure you want to delete "${taskName}"?`)) {
      this.setState({ open: true });

      this.setState({ toDeleteTaskId: taskId, toDeleteTaskName: taskName });
      FirestoreManager.deleteTaskById(taskId);
    }
  };

  handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }

    this.setState({ open: false });
  };

  undoButtonClickedHandler = () => {
    this.setState({ open: false });

    FirestoreManager.reviveTaskById(this.state.toDeleteTaskId);
    setTimeout(() => {
      this.setState({ toDeleteTaskId: '', toDeleteTaskName: '' });
    }, 500);
  };

  componentDidMount() {
    this.updateTasks();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.userId !== this.props.userId) {
      this.updateTasks();
    }
  }

  componentWillUnmount() {
    if (this.unsubscribeTasks) this.unsubscribeTasks();
    if (this.unsubscribeCurrentTaskId) this.unsubscribeCurrentTaskId();
    this.handleSnackbarClose();
  }

  updateTasks = () => {
    if (this.unsubscribeTasks) this.unsubscribeTasks();
    this.unsubscribeTasks = FirestoreManager.getCurrentUserCreatedTasks()
      // .orderBy('updateDate', 'desc')
      .onSnapshot(querySnapshot => {
        let tasks = [];
        querySnapshot.forEach(snapshot => {
          tasks.push({
            id: snapshot.id,
            ...snapshot.data()
          });
        });
        this.setState({ tasks, tasksLoading: false });
      });

    if (this.unsubscribeCurrentTaskId) this.unsubscribeCurrentTaskId();
    this.unsubscribeCurrentTaskId = FirestoreManager.getCurrentUserCurrentTaskId().onSnapshot(
      doc => {
        if (doc.exists) {
          this.setState({ currentTaskId: doc.data().id });
        }
      }
    );
  };

  createNewTaskButtonClickedHandler = () => {
    let taskName = prompt('New task name:');
    if (taskName !== null && taskName !== '') {
      FirestoreManager.createTaskWithName(taskName)
        .then(docRef => {
          let taskId = docRef.id;
          FirestoreManager.updateCurrentUserCurrentTaskId(taskId);
          FirestoreManager.createNewTable({ taskId });
          this.props.history.push(`/tasks/${taskId}`);
        })
        .catch(error => {
          console.log(error);
          alert(error);
        });
    }
  };

  render() {
    let { classes } = this.props;
    const { tasks } = this.state;
    let starredTasks = tasks.filter(task => {
      return task.isStarred === true;
    });

    let createNewTaskButton = (
      <div className={styles.CreateNewTaskButtonContainer}>
        <Tooltip title="Create a new task" aria-label="Add">
          <Fab
            color="primary"
            className={classes.fab}
            onClick={() => this.createNewTaskButtonClickedHandler()}
          >
            <AddIcon />
          </Fab>
        </Tooltip>
      </div>
    );

    return (
      <React.Fragment>
        <div className={styles.AllTasksContainer}>
          {createNewTaskButton}

          <TaskGroup
            category="starred"
            tasks={starredTasks}
            currentTaskId={this.state.currentTaskId}
            handleDeleteButtonClicked={this.handleDeleteButtonClicked}
          />
          <TaskGroup
            category="all"
            tasks={tasks}
            currentTaskId={this.state.currentTaskId}
            handleDeleteButtonClicked={this.handleDeleteButtonClicked}
          />
        </div>
        {/* snackbar */}
        <Snackbar
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'center'
          }}
          open={this.state.open}
          autoHideDuration={this.state.timeoutDuration + 1000}
          onClose={this.handleSnackbarClose}
          ContentProps={{
            'aria-describedby': `message-id-task`
          }}
          message={
            <span
              id={`message-id-task`}
              style={{ display: 'flex', alignItems: 'center' }}
            >
              <LinesEllipsis
                text={this.state.toDeleteTaskName}
                maxLine={2}
                ellipsis="..."
                trimRight
                basedOn="words"
              />{' '}
              <span style={{ marginLeft: '5px' }}>deleted!</span>
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
              onClick={this.handleSnackbarClose}
            >
              <CloseIcon />
            </IconButton>
          ]}
        />
      </React.Fragment>
    );
  }
}

export default withStyles(materialStyles)(AllTasksPage);
