import React, { Component } from 'react';

import TaskCard from '../../../../../components/UI/TaskCard/TaskCard';
import FontAwesome from 'react-fontawesome';
import styles from './TaskGroup.css';

class TaskGroup extends Component {
  state = {
    category: this.props.category
  }

  render () {
    
    const { category } = this.state;
    const { tasks } = this.props;
    
    let title = (
      <div className={styles.Header}>
        <FontAwesome
          name={category === 'starred' ? 'star' : 'tasks'}
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
                combineSourceTaskWithTargetTask={this.props.combineSourceTaskWithTargetTask}
                id={task.id}
                isStarred={task.isStarred}
                key={task.id}
                taskName={task.displayName}
                time={task.time}
                numPieces={Object.keys(task.pieces).length}
                numOptions={Object.keys(task.options).length} />
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