import React, { Component } from 'react';
import styles from './SourcesComponent.css';

import BaseComponent from '../BaseComponent/BaseComponent';

class SourcesComponent extends Component {
  state = {
    domains: []
  };

  componentDidUpdate(prevProps) {
    if (this.props.domains !== prevProps.domains) {
      this.setState({ domains: this.props.domains });
    }
  }

  render() {
    const { domains } = this.state;
    console.log(domains);

    return (
      <BaseComponent headerName={'List of source domains'}>
        source component
      </BaseComponent>
    );
  }
}

export default SourcesComponent;
