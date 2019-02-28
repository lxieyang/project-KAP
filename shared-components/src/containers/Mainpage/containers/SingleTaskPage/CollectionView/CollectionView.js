import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import styles from './CollectionView.css';

import Divider from '@material-ui/core/Divider';

import TaskStatusView from './TaskStatusView/TaskStatusView';
import PiecesView from './PiecesView/PiecesView';

class CollectionView extends Component {
  render() {
    return (
      <React.Fragment>
        <TaskStatusView userId={this.props.userId} />
        <Divider light />
        <PiecesView
          userId={this.props.userId}
          currentWorkspaceId={this.props.currentWorkspaceId}
        />
      </React.Fragment>
    );
  }
}

export default withRouter(CollectionView);
