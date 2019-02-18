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

import SplitPane from 'react-split-pane';
import './SplitPane.css';
import './ContextMenu.css';
import CollectionView from './CollectionView/CollectionView';
import WorkspaceView from './WorkspaceView/WorkspaceView';

class SingleTaskPage extends Component {
  state = {
    currentWorkspaceId: '0'
  };

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

  setCurrentWorkspaceId = workspaceId => {
    this.setState({ currentWorkspaceId: workspaceId });
  };

  componentWillUnmount() {
    this.unsubscribeTaskId();
  }

  render() {
    return (
      <React.Fragment>
        <div className={styles.SingleTaskPageContainer}>
          <SplitPane
            split="vertical"
            minSize={200}
            defaultSize={320}
            maxSize={700}
            pane2Style={{ width: '100%' }}
          >
            <div className={styles.LeftPane}>
              <CollectionView
                currentWorkspaceId={this.state.currentWorkspaceId}
              />
            </div>
            <div className={styles.RightPane}>
              <WorkspaceView
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
      </React.Fragment>
    );
  }
}

export default withRouter(SingleTaskPage);
