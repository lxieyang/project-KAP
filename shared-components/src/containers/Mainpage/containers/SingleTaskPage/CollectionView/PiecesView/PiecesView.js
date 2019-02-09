import React, { Component } from 'react';
import styled from 'styled-components';
import { withRouter } from 'react-router-dom';
import { getTaskIdFromPath } from '../../matchPath';
import * as FirestoreManager from '../../../../../../firebase/firestore_wrapper';
import styles from './PiecesView.css';

class PiecesView extends Component {
  state = {
    pieces: [],

    // editAccess
    editAccess: false
  };

  componentDidMount() {
    let taskId = getTaskIdFromPath(this.props.history.location.pathname);
    this.unsubscribeTaskId = FirestoreManager.getTaskById(taskId).onSnapshot(
      snapshot => {
        if (snapshot.exists) {
          this.setState({
            editAccess:
              snapshot.data().creator === FirestoreManager.getCurrentUserId()
          });
        }
      }
    );

    this.unsubscribePieces = FirestoreManager.getAllPiecesInTask(taskId);
  }

  componentWillUnmount() {
    this.unsubscribeTaskId();
    this.unsubscribePieces();
  }

  render() {
    return <React.Fragment>list</React.Fragment>;
  }
}

export default withRouter(PiecesView);
