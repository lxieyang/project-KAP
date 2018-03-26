import React, { Component } from 'react';

import Aux from '../../../../hoc/Aux/Aux';
import Header from '../../components/Header/Header';
import styles from './Layout.css';


class Layout extends Component {
  state = {
  }

  render () {
    
    return (
      <Aux>
        <Header taskName={this.props.currentTaskName} userName={this.props.userName}/>
        <main className={styles.Content}>
          {this.props.children}
        </main>
      </Aux>
    );
  }
}

export default Layout;