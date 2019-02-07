import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { matchPath } from 'react-router';
import qs from 'query-string';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import fasCopy from '@fortawesome/fontawesome-free-solid/faCopy';
import TaskStatusView from './TaskStatusView/TaskStatusView';
import styles from './SingleTaskPage.css';
import {
  APP_NAME_SHORT,
  showoffSurveyUrl,
  projectIntroPage
} from '../../../../shared/constants';
import * as FirebaseStore from '../../../../firebase/store';
import * as FirestoreManager from '../../../../firebase/firestore_wrapper';

class SingleTaskPage extends Component {
  state = {
    taskId: null,
    taskName: null
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
          this.setState({ taskName: taskName });
          this.props.setDisplayingTaskIdAndName(taskId, taskName);
        }
      });
  }

  render() {
    const { taskId, taskName } = this.state;
    return (
      <React.Fragment>
        <div>navigated to task: {taskName}</div>
      </React.Fragment>
    );
  }
}

export default withRouter(SingleTaskPage);
