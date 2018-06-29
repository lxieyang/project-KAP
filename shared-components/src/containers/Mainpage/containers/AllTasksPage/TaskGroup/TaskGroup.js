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
  }

  render () {
    
    const { category } = this.state;
    let { tasks } = this.props;
    tasks = reverse(sortBy(tasks, ['time']));
    
    let title = (
      <div className={styles.Header}>
        <FontAwesomeIcon
          icon={category === 'starred' ? fasStar : fasTasks}
          className={styles.ConfigureIcon}
        />
        <span className={styles.HeaderName}>
          { category === 'starred' ? 'Starred Tasks' : 'All Tasks' }
        </span>
      </div>
    );
    let taskCards = null;
    if (tasks && tasks.length > 0) {
      taskCards = (
        <div className={styles.TaskCards}>
          { tasks.map((task, idx) => {
            return (
              <TaskCard 
                currentTaskId={this.props.currentTaskId}
                combineSourceTaskWithTargetTask={this.props.combineSourceTaskWithTargetTask}
                id={task.id}
                taskOngoing={task.taskOngoing}
                completionTimestamp={task.completionTimestamp}
                isStarred={task.isStarred}
                key={task.id}
                taskName={task.displayName}
                time={task.time}
                numPieces={Object.keys(task.pieces).length}
                numOptions={Object.keys(task.options).length}
                numRequirements={Object.keys(task.requirements).length} />
            );
          })}
        </div>
      )
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