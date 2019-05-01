import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { getTaskIdFromPath } from './matchPath';
import Spinner from '../../../../components/UI/Spinner/Spinner';
import styles from './SingleTaskStatusPage.css';
import * as FirestoreManager from '../../../../firebase/firestore_wrapper';

import GeneralStats from './GeneralStats/GeneralStats';
import ActivityStats from './ActivityStats/ActivityStats';

class SingleTaskStatusPage extends Component {
  state = {
    taskLoading: true,
    taskExists: false,
    task: null
  };

  componentDidMount() {
    let taskId = getTaskIdFromPath(this.props.history.location.pathname);

    this.unsubscribeTaskId = FirestoreManager.getTaskById(taskId).onSnapshot(
      snapshot => {
        if (snapshot.exists) {
          let task = { id: snapshot.id, ...snapshot.data() };

          this.setState({
            taskLoading: false,
            taskExists: task.trashed ? false : true,
            task
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

  componentWillUnmount() {
    this.unsubscribeTaskId();
  }

  render() {
    const { taskLoading, taskExists, task } = this.state;

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
        <div className={styles.SingleTaskStatusPageContainer}>
          <GeneralStats userId={this.props.userId} />
          <ActivityStats userId={this.props.userId} />
        </div>
      </React.Fragment>
    );
  }
}

export default withRouter(SingleTaskStatusPage);
