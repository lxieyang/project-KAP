import React, { Component } from 'react';
import styled from 'styled-components';
import { withRouter } from 'react-router-dom';
import { getTaskIdFromPath } from './matchPath';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import fasCopy from '@fortawesome/fontawesome-free-solid/faCopy';
import styles from './SingleTaskPage.css';
import {
  APP_NAME_SHORT,
  showoffSurveyUrl,
  projectIntroPage
} from '../../../../shared/constants';
import * as FirestoreManager from '../../../../firebase/firestore_wrapper';

import CollectionView from './CollectionView/CollectionView';

class SingleTaskPage extends Component {
  state = {};

  componentDidMount() {
    let taskId = getTaskIdFromPath(this.props.history.location.pathname);

    this.unsubscribeTaskId = FirestoreManager.getTaskById(taskId).onSnapshot(
      snapshot => {
        if (snapshot.exists) {
          let taskName = snapshot.data().name;
          this.props.setDisplayingTaskIdAndName(taskId, taskName);
        }
      }
    );
  }

  componentWillUnmount() {
    this.unsubscribeTaskId();
  }

  render() {
    return (
      <React.Fragment>
        <div className={styles.SingleTaskPageContainer}>
          <div className={styles.LeftPane}>
            <CollectionView />
          </div>
          <div className={styles.RightPane}>Right</div>
        </div>
      </React.Fragment>
    );
  }
}

export default withRouter(SingleTaskPage);
