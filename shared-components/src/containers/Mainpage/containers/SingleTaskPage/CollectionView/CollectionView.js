import React, { Component } from 'react';
import styled from 'styled-components';
import { withRouter } from 'react-router-dom';
import { matchPath } from 'react-router';
import * as FirestoreManager from '../../../../../firebase/firestore_wrapper';
import styles from './CollectionView.css';
import TaskStatusView from './TaskStatusView/TaskStatusView';

class CollectionView extends Component {
  render() {
    return (
      <React.Fragment>
        <TaskStatusView />
      </React.Fragment>
    );
  }
}

export default withRouter(CollectionView);
