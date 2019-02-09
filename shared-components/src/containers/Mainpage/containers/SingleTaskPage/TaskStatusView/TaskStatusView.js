import React, { Component } from 'react';
import styled from 'styled-components';
import { withRouter } from 'react-router-dom';
import { matchPath } from 'react-router';
import * as FirestoreManager from '../../../../../firebase/firestore_wrapper';
import styles from './TaskStatusView.css';

class TaskStatusView extends Component {
  state = {
    taskId: null,
    taskName: null,
    editAccess: false
  };

  componentDidMount() {
    const taskMatch = matchPath(this.props.history.location.pathname, {
      path: '/tasks/:taskId',
      exact: true,
      strict: false
    });

    let taskId = taskMatch.params.taskId;
    FirestoreManager.getTaskById(taskId)
      .get()
      .then(doc => {
        if (doc.exists) {
          let task = doc.data();
          let creatorId = task.creator;
          this.setState({
            taskId,
            taskName: task.name,
            editAccess: creatorId === FirestoreManager.getCurrentUserId()
          });
        }
      });
  }

  render() {
    const { taskName } = this.state;
    console.log(this.state.editAccess);
    return (
      <React.Fragment>
        <div>navigated to task: {taskName}</div>
      </React.Fragment>
    );
  }
}

export default withRouter(TaskStatusView);
