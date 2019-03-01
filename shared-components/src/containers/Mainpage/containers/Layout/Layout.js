import React, { Component } from 'react';

import Aux from '../../../../hoc/Aux/Aux';
import Header from '../../components/Header/Header';
import styles from './Layout.css';

class Layout extends Component {
  state = {};

  render() {
    return (
      <Aux>
        <Header
          authenticated={this.props.authenticated}
          thereIsTask={this.props.thereIsTask}
          tasksLoading={this.props.tasksLoading}
          taskName={this.props.currentTaskName}
          currentTaskId={this.props.currentTaskId}
          userName={this.props.userName}
          userProfilePhotoURL={this.props.userProfilePhotoURL}
          userId={this.props.userId}
        />

        <main className={styles.Content}>{this.props.children}</main>
      </Aux>
    );
  }
}

export default Layout;
