import React, { Component } from 'react';
import BaseComponent from '../BaseComponent/BaseComponent';

import Divider from '@material-ui/core/Divider';
import TaskContext from '../../../../../../../../../shared/task-context';

import styles from './TimelineComponent.css';

class TimelineComponent extends Component {
  static contextType = TaskContext;
  state = {};

  render() {
    return (
      <React.Fragment>
        {' '}
        <Divider light />{' '}
        <BaseComponent shouldOpenOnMount={true} headerName={'Timeline'}>
          timeline
        </BaseComponent>
      </React.Fragment>
    );
  }
}

export default TimelineComponent;
