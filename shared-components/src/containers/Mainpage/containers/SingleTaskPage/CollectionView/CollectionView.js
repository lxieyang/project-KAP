import React, { Component } from 'react';
import styled from 'styled-components';
import { withRouter } from 'react-router-dom';
import { matchPath } from 'react-router';
import * as FirestoreManager from '../../../../../firebase/firestore_wrapper';
import styles from './CollectionView.css';

import Divider from '@material-ui/core/Divider';

import TaskStatusView from './TaskStatusView/TaskStatusView';
import PiecesView from './PiecesView/PiecesView';

class CollectionView extends Component {
  render() {
    return (
      <React.Fragment>
        <TaskStatusView />
        <Divider light />
        <PiecesView currentWorkspaceId={this.props.currentWorkspaceId} />
      </React.Fragment>
    );
  }
}

export default withRouter(CollectionView);
