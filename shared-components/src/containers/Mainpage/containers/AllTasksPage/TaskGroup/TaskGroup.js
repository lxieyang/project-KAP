import React, { Component } from 'react';
import { reverse, sortBy } from 'lodash';

import TaskCard from '../../../../../components/UI/TaskCard/TaskCard';
import FontAwesome from 'react-fontawesome';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import fasStar from '@fortawesome/fontawesome-free-solid/faStar';
import fasTasks from '@fortawesome/fontawesome-free-solid/faTasks';
import styles from './TaskGroup.css';

class TaskGroup extends Component {
  state = {
    category: this.props.category
  };

  render() {
    const { category } = this.state;
    let { tasks } = this.props;
    tasks = reverse(sortBy(tasks, ['updateDate']));

    let title = (
      <div className={styles.Header}>
        <FontAwesomeIcon
          icon={category === 'starred' ? fasStar : fasTasks}
          className={styles.ConfigureIcon}
        />
        <span className={styles.HeaderName}>
          {category === 'starred' ? 'Starred Tasks' : 'All Tasks'}
        </span>
      </div>
    );
    let taskCards = null;
    if (tasks && tasks.length > 0) {
      taskCards = (
        <div className={styles.TaskCards}>
          {tasks.map((task, idx) => {
            return (
              <div key={`${task.id}-${idx}`}>
                <TaskCard
                  task={task}
                  currentTaskId={this.props.currentTaskId}
                  handleDeleteButtonClicked={
                    this.props.handleDeleteButtonClicked
                  }
                />
              </div>
            );
          })}
        </div>
      );
    }

    return (
      <div className={styles.TaskGroup}>
        {title}
        {taskCards}
      </div>
    );
  }
}

export default TaskGroup;
