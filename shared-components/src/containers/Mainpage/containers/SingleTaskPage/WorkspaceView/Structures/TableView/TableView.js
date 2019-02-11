import React, { Component } from 'react';
import styled from 'styled-components';
import { withRouter } from 'react-router-dom';
import { matchPath } from 'react-router';
import * as FirestoreManager from '../../../../../../../firebase/firestore_wrapper';
import styles from './TableView.css';

class TableView extends Component {
  state = {
    workspaceId: this.props.workspace.id
  };

  render() {
    let { workspace } = this.props;
    return (
      <React.Fragment>
        <div className={styles.TableViewContainer}>
          Table view {workspace.name}
        </div>
      </React.Fragment>
    );
  }
}

export default withRouter(TableView);
