import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { getTaskIdFromPath } from './matchPath';
import Spinner from '../../../../components/UI/Spinner/Spinner';
import styles from './SingleTaskPage.css';
import * as FirestoreManager from '../../../../firebase/firestore_wrapper';

import SplitPane from 'react-split-pane';
import './SplitPane.css';
import './ContextMenu.css';
import CollectionView from './CollectionView/CollectionView';
import WorkspaceView from './WorkspaceView/WorkspaceView';

import TaskContext from '../../../../shared/task-context';

class SingleTaskPage extends Component {
  state = {
    currentWorkspaceId: '0',

    taskLoading: true,
    taskExists: false,

    taskId: null,
    isDemoTask: false
  };

  componentDidMount() {
    let taskId = getTaskIdFromPath(this.props.history.location.pathname);
    this.setState({
      taskId,
      isDemoTask: taskId === 'z2Xs6eFIvi7sw1fCl1a6' // taskId === 'fnbS9l31Y6rMBj0CrsQA'
    });

    this.unsubscribeTaskId = FirestoreManager.getTaskById(taskId).onSnapshot(
      snapshot => {
        if (snapshot.exists) {
          let task = { id: snapshot.id, ...snapshot.data() };
          this.setState({
            taskLoading: false,
            taskExists: task.trashed ? false : true
          });
          if (!task.trashed) {
            this.props.setDisplayingTaskIdAndName(task.id, task.name);
          }
        } else {
          this.setState({ taskLoading: false, taskExists: false });
        }
      }
    );
  }

  setCurrentWorkspaceId = workspaceId => {
    this.setState({ currentWorkspaceId: workspaceId });
  };

  componentWillUnmount() {
    this.unsubscribeTaskId();
  }

  render() {
    const { taskLoading, taskExists } = this.state;

    if (taskLoading) {
      return (
        <div className={styles.TaskNotExistsContainer}>
          <Spinner size="40px" />
        </div>
      );
    }

    if (!taskExists) {
      return (
        <div className={styles.TaskNotExistsContainer}>
          <div style={{ width: '80%', textAlign: 'center' }}>
            Oops, the task you want to visit has not been created yet, or the
            owner has deleted it.
          </div>
        </div>
      );
    }

    return (
      <React.Fragment>
        <TaskContext.Provider
          value={{
            currentTaskId: this.state.taskId,
            isDemoTask: this.state.isDemoTask
          }}
        >
          <div className={styles.SingleTaskPageContainer}>
            <SplitPane
              split="vertical"
              minSize={200}
              defaultSize={348}
              maxSize={800}
              pane2Style={{ width: '100%' }}
            >
              <div className={styles.LeftPane}>
                <CollectionView
                  userId={this.props.userId}
                  currentWorkspaceId={this.state.currentWorkspaceId}
                />
              </div>
              <div className={styles.RightPane}>
                <WorkspaceView
                  userId={this.props.userId}
                  setCurrentWorkspaceId={this.setCurrentWorkspaceId}
                />
              </div>
            </SplitPane>
            {/*
          <div className={styles.LeftPane}>
            <CollectionView />
          </div>
          <div className={styles.RightPane}>
            <WorkspaceView />
          </div>
      */}
          </div>
        </TaskContext.Provider>
      </React.Fragment>
    );
  }
}

export default withRouter(SingleTaskPage);
