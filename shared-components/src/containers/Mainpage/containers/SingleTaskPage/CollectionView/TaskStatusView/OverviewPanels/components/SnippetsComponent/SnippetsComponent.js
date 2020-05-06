import React, { Component } from 'react';
import BaseComponent from '../BaseComponent/BaseComponent';

import Divider from '@material-ui/core/Divider';

import styles from './SnippetsComponent.css';

class SnippetsComponent extends Component {
  render() {
    let { pieces, shouldOpenOnMount } = this.props;
    return (
      <React.Fragment>
        <Divider light />
        <BaseComponent
          shouldOpenOnMount={shouldOpenOnMount}
          headerName={'List of snippets'}
        >
          nice
        </BaseComponent>
      </React.Fragment>
    );
  }
}

export default SnippetsComponent;
