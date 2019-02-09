import React, { Component } from 'react';
import styled from 'styled-components';
import { withRouter } from 'react-router-dom';
import { matchPath } from 'react-router';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import fasCopy from '@fortawesome/fontawesome-free-solid/faCopy';
import styles from './SingleTaskPage.css';
import {
  APP_NAME_SHORT,
  showoffSurveyUrl,
  projectIntroPage
} from '../../../../shared/constants';
import * as FirestoreManager from '../../../../firebase/firestore_wrapper';

import TaskStatusView from './TaskStatusView/TaskStatusView';

class SingleTaskPage extends Component {
  state = {
    taskId: null
  };

  componentDidMount() {
    const taskMatch = matchPath(this.props.history.location.pathname, {
      path: '/tasks/:taskId',
      exact: true,
      strict: false
    });

    let taskId = taskMatch.params.taskId;

    this.setState({ taskId: taskId });
    FirestoreManager.getTaskById(taskId)
      .get()
      .then(doc => {
        if (doc.exists) {
          let taskName = doc.data().name;
          this.props.setDisplayingTaskIdAndName(taskId, taskName);
        }
      });
  }

  render() {
    const { taskId } = this.state;
    return (
      <React.Fragment>
        <div className={styles.TaskStatusViewContainer} />
        <TaskStatusView />
      </React.Fragment>
    );
  }
}

export default withRouter(SingleTaskPage);
