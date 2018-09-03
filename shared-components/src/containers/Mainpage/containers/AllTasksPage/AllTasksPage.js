import React, { Component } from 'react';

import TaskGroup from './TaskGroup/TaskGroup';
import styles from './AllTasksPage.css';
// import * as actionTypes from '../../../../shared/actionTypes';
import * as FirebaseStore from '../../../../firebase/store';
import Snackbar from '../../../../components/UI/Snackbar/Snackbar';

class AllTasksPage extends Component {

  state = {
    // snackbar
    deleteTaskSnackbarShouldShow: false,
    toDeleteTaskId: null,
    toDeleteTaskName: null,
  }

  showSnackbar = (id, name) => {
    // https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_snackbar
    this.setState({
      deleteTaskSnackbarShouldShow: true,
      toDeleteTaskId: id,
      toDeleteTaskName: name
    });
    this.deleteTaskSnackbarTimer = setTimeout(() => {
      this.setState({
        deleteTaskSnackbarShouldShow: false,
        toDeleteTaskId: null,
        toDeleteTaskName: null
      });
    }, 5000);
  }

  deleteTaskHandler = (id, name) => {
    this.showSnackbar(id, name);

    FirebaseStore.switchTaskVisibility(id, false);
    this.deleteTaskTimer = setTimeout(() => {
      FirebaseStore.deleteTaskWithId(id);
    }, 6000);
  }

  undoDeleteTaskHandler = () => {
    clearTimeout(this.deleteTaskTimer);
    clearTimeout(this.deleteTaskSnackbarTimer);
    FirebaseStore.switchTaskVisibility(this.state.toDeleteTaskId, true);
    this.setState({
      deleteTaskSnackbarShouldShow: false
    })
  }

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
          combineSourceTaskWithTargetTask={this.combineSourceTaskWithTargetTask}
          deleteTaskHandler={this.deleteTaskHandler}/>
        <TaskGroup 
          category='all' tasks={tasks}
          currentTaskId={this.props.currentTaskId}
          combineSourceTaskWithTargetTask={this.combineSourceTaskWithTargetTask}
          deleteTaskHandler={this.deleteTaskHandler}/>

        <Snackbar 
          id="deleteTaskSnackbar"
          show={this.state.deleteTaskSnackbarShouldShow}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <div className={styles.SnackbarLeft}>
              Task <u>{this.state.toDeleteTaskName}</u> deleted
            </div>
            <div className={styles.SnackbarRight}>
              <button 
                className={styles.UndoButton}
                onClick={() => this.undoDeleteTaskHandler()}>UNDO</button>
            </div>
          </div>
        </Snackbar>
      </div>
    );
  }
}

export default AllTasksPage;