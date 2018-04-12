import React, { Component } from 'react';

import TaskGroup from './TaskGroup/TaskGroup';
import styles from './AllTasksPage.css';
// import * as actionTypes from '../../../../shared/actionTypes';
import * as FirebaseStore from '../../../../firebase/store';

class AllTasksPage extends Component {

  combineSourceTaskWithTargetTask = (sourceTaskId, sourceTaskName, targetTaskId, targetTaskName) => {
    let shouldCombine = window.confirm(`Are you sure you want to combine \n\n"${sourceTaskName}" \n\nwith \n\n"${targetTaskName}"? \n\n(New task will be named after "${targetTaskName}")`);
    // console.log(shouldCombine);
    if (shouldCombine) {
      // chrome.runtime.sendMessage({
      //   msg: actionTypes.COMBINE_SOURCE_TASK_WITH_TARGET_TASK,
      //   payload: {
      //     sourceId: sourceTaskId,
      //     targetId: targetTaskId,
      //     newTaskName: targetTaskName
      //   }
      // });
      FirebaseStore.combineTasks(sourceTaskId, targetTaskId, targetTaskName);
    }
  }

  render () {
    const { tasks } = this.props;
    let starredTasks = tasks.filter(task => {
      return task.isStarred === true
    });

    return (
      <div className={styles.AllTasksContainer}>
        <TaskGroup 
          category='starred' tasks={starredTasks}
          currentTaskId={this.props.currentTaskId}
          combineSourceTaskWithTargetTask={this.combineSourceTaskWithTargetTask}/>
        <TaskGroup 
          category='all' tasks={tasks}
          currentTaskId={this.props.currentTaskId}
          combineSourceTaskWithTargetTask={this.combineSourceTaskWithTargetTask}/>
      </div>
    );
  }
}

export default AllTasksPage;