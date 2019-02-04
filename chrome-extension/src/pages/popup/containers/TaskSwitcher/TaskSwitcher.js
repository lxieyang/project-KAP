import React, { Component } from 'react';
import styled from 'styled-components';
import Dropdown from 'react-dropdown'; // https://github.com/fraserxu/react-dropdown
import 'react-dropdown/style.css';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import fasTh from '@fortawesome/fontawesome-free-solid/faTh';

import { withStyles } from '@material-ui/core/styles';
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import { ViewGrid, Star } from 'mdi-material-ui';
import Tooltip from '@material-ui/core/Tooltip';
import Button from '@material-ui/core/Button';

import { THEME_COLOR } from '../../../../../../shared-components/src/shared/theme';

import firebase from '../../../../../../shared-components/src/firebase/firebase';
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
  }
});

const TaskSwitcherContainer = styled.div`
  /* background-color: #ccc; */
  box-sizing: border-box;
  width: 100%;
  padding: 0px 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
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
    tasksLoading: true
  };

  componentDidMount() {
    this.unsubscribeUserCreatedTasksListener = FirestoreManager.getCurrentUserCreatedTasks()
      .orderBy('updateDate', 'desc')
      .onSnapshot(querySnapshot => {
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
        // successfully created
        setTimeout(() => {
          // for rendering purposes, do not touch before figuring out a good solution
          this.setState({
            options: [
              ...this.state.options,
              { value: 'new-task', label: taskName }
            ],
            currentOptionId: 'new-task'
          });
        }, 5);

        FirestoreManager.createTaskWithName(taskName)
          .then(docRef => {
            FirestoreManager.updateCurrentUserCurrentTaskId(docRef.id);
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
      // successfully created
      setTimeout(() => {
        // for rendering purposes, do not touch before figuring out a good solution
        this.setState({
          options: [
            ...this.state.options,
            { value: 'new-task', label: taskName }
          ],
          currentOptionId: 'new-task'
        });
      }, 5);

      FirestoreManager.createTaskWithName(taskName)
        .then(docRef => {
          FirestoreManager.updateCurrentUserCurrentTaskId(docRef.id);
        })
        .catch(error => {
          console.log(error);
          alert(error);
        });
    }
  };

  updateTaskName = (taskId, currentName) => {
    let taskName = prompt('Change task name to:', currentName);
    if (taskName !== null && taskName !== '') {
      FirestoreManager.updateTaskName(taskId, taskName);
    }
  };

  toggleTaskStarStatus = (taskId, currentStarStatus) => {
    FirestoreManager.toggleTaskStarStatus(taskId, !currentStarStatus);
  };

  render() {
    let { classes } = this.props;
    let currentTask = this.state.options.filter(op => {
      return op.value === this.state.currentOptionId;
    })[0];

    return (
      <React.Fragment>
        <TaskSwitcherContainer>
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
                <Star
                  className={classes.iconInIconButtons}
                  style={{
                    color: currentTask.data.isStarred
                      ? THEME_COLOR.starColor
                      : null
                  }}
                />
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
              <IconButton aria-label="Delete" className={classes.iconButtons}>
                <DeleteIcon className={classes.iconInIconButtons} />
              </IconButton>
            </Tooltip>
            <Tooltip title="All tasks" placement={'bottom'}>
              <IconButton aria-label="Grid" className={classes.iconButtons}>
                <ViewGrid className={classes.iconInIconButtons} />
              </IconButton>
            </Tooltip>
          </VariousButtonsContainer>
        </TaskSwitcherContainer>
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
        ) : null}
      </React.Fragment>
    );
  }
}

export default withStyles(styles)(TaskSwitcher);
