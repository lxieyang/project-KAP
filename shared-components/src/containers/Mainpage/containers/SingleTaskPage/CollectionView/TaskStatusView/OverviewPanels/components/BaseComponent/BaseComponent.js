import React, { Component } from 'react';
import styles from './BaseComponent.css';

class BaseComponent extends Component {
  render() {
    const { headerName, children } = this.props;
    return (
      <div className={styles.BaseComponentContainer}>
        <div className={styles.BaseComponentHeader}>{headerName}</div>
        {children}
      </div>
    );
  }
}

export default BaseComponent;
