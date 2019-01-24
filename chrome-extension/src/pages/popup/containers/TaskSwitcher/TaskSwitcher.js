import React, { Component } from 'react';
import styled from 'styled-components';
import Dropdown from 'react-dropdown'; // https://github.com/fraserxu/react-dropdown
import 'react-dropdown/style.css';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import fasTh from '@fortawesome/fontawesome-free-solid/faTh';

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

class TaskSwitcher extends Component {
  state = {
    options: [
      {
        value: 'create-new-task',
        label: 'Create a new task'
      },
      {
        value: 'task-id-1',
        label: 'This is a really really long task name'
      },
      {
        value: 'task-id-2',
        label: 'Task 2'
      },
      {
        value: 'task-id-3',
        label: 'How to store information in chrome extensions'
      }
    ],
    currentOptionId: 'task-id-1'
  };

  componentDidMount() {
    setTimeout(() => {
      let options = [...this.state.options];
      options.push({ value: 'task-id-4', label: 'Another task' });
      this.setState({ options: options });
    }, 3000);
  }

  _onSelect = selectedTask => {
    console.log(selectedTask);
    this.setState({ currentOptionId: selectedTask.value });
    if (selectedTask.value === 'create-new-task') {
      let taskName = prompt('New task name:');
      console.log(taskName);
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
            placeholder="Select an option"
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
