import React, { Component } from 'react';
import styles from './BaseComponent.css';

import { Collapse } from 'react-collapse';
import { BsFillEyeSlashFill, BsFillEyeFill } from 'react-icons/bs';

class BaseComponent extends Component {
  state = { isOpen: false };

  componentDidMount() {
    if (this.props.shouldOpenOnMount === true) {
      this.setState({ isOpen: true });
    }
  }

  handleSwitchCollapsedStatus = e => {
    this.setState(prevState => {
      return { isOpen: !prevState.isOpen };
    });
  };

  render() {
    const { headerName, children } = this.props;
    const { isOpen } = this.state;
    return (
      <div className={styles.BaseComponentContainer}>
        <div
          className={styles.BaseComponentHeader}
          onClick={this.handleSwitchCollapsedStatus}
        >
          {headerName}
          <div style={{ flex: 1 }} />
          {isOpen ? <BsFillEyeFill /> : <BsFillEyeSlashFill />}
        </div>
        <Collapse isOpened={isOpen}>{children}</Collapse>
      </div>
    );
  }
}

export default BaseComponent;
