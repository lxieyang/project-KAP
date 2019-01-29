import React, { Component } from 'react';
import styled from 'styled-components';
import Dropdown from 'react-dropdown'; // https://github.com/fraserxu/react-dropdown
import 'react-dropdown/style.css';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import fasTh from '@fortawesome/fontawesome-free-solid/faTh';
import firebase from '../../../../../../shared-components/src/firebase/firebase';
import * as FirestoreManager from '../../../../../../shared-components/src/firebase/firestore_wrapper';

import styles from './TaskSwitcher.css';

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
`;

const VariousButton = styled.div`
  display: flex;
  justify-content: space-around;
  align-items: center;
`;

const createNewTaskOption = {
  value: 'create-new-task',
  label: 'Create a new task',
  className: styles.CreateNewClassName
};

class TaskSwitcher extends Component {
  state = {
    options: [createNewTaskOption],
    currentOptionId: createNewTaskOption.value
  };

  componentDidMount() {
    this.unsubscribeUserCreatedTasksListener = FirestoreManager.getCurrentUserCreatedTasks()
      .orderBy('updateDate', 'desc')
      .onSnapshot(querySnapshot => {
        let tasks = [createNewTaskOption];
        querySnapshot.forEach(function(doc) {
          tasks.push({
            value: doc.id,
            label: doc.data().name
          });
        });
        this.setState({ options: tasks });
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
            // this.setState({ currentOptionId: docRef.id });
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

  render() {
    return (
      <React.Fragment>
        <TaskSwitcherContainer>
          <Dropdown
            className={styles.DropdownRoot}
            controlClassName={styles.DropdownControl}
            placeholderClassName={styles.DropdownPlaceholder}
            menuClassName={styles.DropdownMenu}
            options={this.state.options}
            onChange={this._onSelect}
            value={
              this.state.options.filter(op => {
                return op.value === this.state.currentOptionId;
              })[0]
            }
            placeholder="Select a task"
          />
          <VariousButtonsContainer>
            <VariousButton title={'All Tasks'}>
              <FontAwesomeIcon icon={fasTh} className={styles.AllTasksButton} />
            </VariousButton>
          </VariousButtonsContainer>
        </TaskSwitcherContainer>
      </React.Fragment>
    );
  }
}

export default TaskSwitcher;
