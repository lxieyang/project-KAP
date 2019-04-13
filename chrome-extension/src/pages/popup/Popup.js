/* global chrome */
import React, { Component } from 'react';

import AppHeader from '../../../../shared-components/src/components/UI/AppHeader/AppHeader';
import TaskSwitcher from './containers/TaskSwitcher/TaskSwitcher';
import Workspaces from './containers/Workspaces/Workspaces';
import Pieces from './containers/Pieces/Pieces';
import styles from './Popup.css';
import './ContextMenu.css';
import { APP_NAME_SHORT } from '../../../../shared-components/src/shared/constants';
import Spinner from '../../../../shared-components/src/components/UI/Spinner/Spinner';
import firebase from '../../../../shared-components/src/firebase/firebase';

import HTML5Backend from 'react-dnd-html5-backend';
import { DragDropContext } from 'react-dnd';

import * as FirestoreManager from '../../../../shared-components/src/firebase/firestore_wrapper';
import { TIMESTAMP_TYPES } from '../../../../shared-components/src/shared/types';
import { getAnonymizationInfo } from '../../../../shared-components/src/shared/utilities';

class Popup extends Component {
  state = {
    userId: null,
    userName: null,
    userProfilePhotoURL: null,
    idToken: null,

    currentTaskId: null,

    loadingUserInfo: true,

    currentWorkspaceId: '0',

    currentSelectedPieceInTable: null,
    currentSelectedPieceInPieces: null,

    annotation_selected: false,
    selected_annotation_id: null
  };

  componentDidMount() {
    getAnonymizationInfo();

    chrome.runtime.sendMessage({ msg: 'GET_USER_INFO' }, response => {
      this.signInOutUserWithCredential(response.idToken);
    });

    // authenticate upon signin
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.msg === 'USER_LOGIN_STATUS_CHANGED') {
        this.signInOutUserWithCredential(request.idToken);
      }
    });

    // authenticate upon signin
    chrome.runtime.onMessage.addListener(this.annotationSelectionListener);
  }

  componentWillUnmount() {
    chrome.runtime.onMessage.removeListener(this.annotationSelectionListener);
  }

  annotationSelectionListener = (request, sender, sendResponse) => {
    if (request.msg === 'ANNOTATION_SELECTED') {
      this.setState({ annotation_selected: true });
      // console.log('selected');
    } else if (request.msg === 'SELECTED_ANNOTATION_ID_UPDATED') {
      this.setState({ selected_annotation_id: request.pieceId });
    } else if (request.msg === 'ANNOTATION_UNSELECTED') {
      this.setState({ annotation_selected: false });
      this.setState({ selected_annotation_id: null });
      // console.log('unselected');
    }
  };

  signInOutUserWithCredential = idToken => {
    this.setState({ idToken });
    if (idToken !== null) {
      // logged in
      firebase
        .auth()
        .signInAndRetrieveDataWithCredential(
          firebase.auth.GoogleAuthProvider.credential(idToken)
        )
        .then(result => {
          let user = result.user;
          this.setState({
            userId: user.uid,
            userName: user.displayName,
            userProfilePhotoURL: user.photoURL,
            loadingUserInfo: false
          });
        })
        .catch(error => {
          console.log(error);
          this.setState({ loadingUserInfo: false });
        });
    } else {
      // logged out
      firebase
        .auth()
        .signOut()
        .then(() => {
          this.setState({
            userId: null,
            userName: null,
            userProfilePhotoURL: null,
            loadingUserInfo: false
          });
        })
        .catch(error => {
          console.log(error);
          this.setState({ loadingUserInfo: false });
        });
    }
  };

  logInClickedHandler = () => {
    this.setState({ loadingUserInfo: true });
    let provider = new firebase.auth.GoogleAuthProvider();
    firebase
      .auth()
      .signInWithPopup(provider)
      .then(function(result) {
        chrome.runtime.sendMessage({
          msg: 'USER_LOGGED_IN',
          credential: result.credential,
          user: result.user
        });
      })
      .catch(function(error) {
        console.log(error);
        this.setState({ loadingUserInfo: false });
      });
  };

  logoutClickedHandler = () => {
    this.setState({ loadingUserInfo: true });
    chrome.runtime.sendMessage({
      msg: 'USER_LOGGED_OUT'
    });
  };

  openSettingsPageClickedHandler = () => {
    console.log('open settings tab');
    chrome.runtime.sendMessage({
      msg: 'OPEN_SETTINGS_PAGE'
    });
  };

  setCurrentTaskId = taskId => {
    this.setState({ currentTaskId: taskId });
  };

  setCurrentWorkspaceId = workspaceId => {
    this.setState({ currentWorkspaceId: workspaceId });
  };

  setCurrentSelectedPieceInTable = ({ pieceId, pieceType }) => {
    // console.log(pieceId, ' ', pieceType);
    if (pieceId !== null) {
      this.setState({
        currentSelectedPieceInTable: { pieceId, pieceType }
      });
    } else {
      this.setState({
        currentSelectedPieceInTable: null
      });
    }
  };

  setCurrentSelectedPieceInPieces = ({ pieceId, pieceType }) => {
    // console.log(pieceId, ' ', pieceType);
    if (pieceId !== null) {
      this.setState({
        currentSelectedPieceInPieces: { pieceId, pieceType }
      });
    } else {
      this.setState({
        currentSelectedPieceInPieces: null
      });
    }
  };

  popupClickedHandler = e => {
    e.stopPropagation();
    if (this.state.currentSelectedPieceInTable !== null) {
      this.setCurrentSelectedPieceInTable({
        pieceId: null,
        pieceType: null
      });
    }
    if (this.state.currentSelectedPieceInPieces !== null) {
      this.setCurrentSelectedPieceInPieces({
        pieceId: null,
        pieceType: null
      });
    }
  };

  render() {
    if (this.state.loadingUserInfo) {
      return (
        <div
          style={{
            width: '100%',
            height: '300px',
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center'
          }}
        >
          <Spinner size={'30px'} />
        </div>
      );
    }

    let isLoggedIn = !(
      this.state.userId === null || this.state.userId === 'invalid'
    );

    let appTitle = (
      <AppHeader
        logoSize="20px"
        hover={false}
        shouldDisplayHeaderButtons={isLoggedIn}
        userId={this.state.userId}
        userName={this.state.userName}
        userProfilePhotoURL={this.state.userProfilePhotoURL}
        loadingUserInfo={this.state.loadingUserInfo}
        isSigningOut={this.state.isSigningOut}
        logInClickedHandler={this.logInClickedHandler}
        logoutClickedHandler={this.logoutClickedHandler}
        openInNewTabClickedHandler={this.openInNewTabClickedHandler}
        openSettingsPageClickedHandler={this.openSettingsPageClickedHandler}
      />
    );

    if (!isLoggedIn) {
      return (
        <React.Fragment>
          {appTitle}
          <div
            style={{
              width: '100%',
              height: '100px',
              display: 'flex',
              justifyContent: 'space-around',
              alignItems: 'center'
            }}
          >
            Please log in to use {APP_NAME_SHORT}.
          </div>
        </React.Fragment>
      );
    }

    // logged in
    return (
      <div
        style={{ display: 'flex', flexFlow: 'column', height: '100vh' }}
        onClick={e => this.popupClickedHandler(e)}
        // for tracking time in sidebar
        onMouseEnter={() => {
          this.lastVisitTimestamp = new Date().getTime();
        }}
        onMouseLeave={() => {
          // console.log('leave');
          let now = new Date().getTime();
          let duration = now - this.lastVisitTimestamp;
          if (duration > 2000 && this.state.currentTaskId !== null) {
            FirestoreManager.addActionTimestamps(this.state.currentTaskId, {
              timestampType: TIMESTAMP_TYPES.inSidebar,
              duration: duration,
              startTimestamp: this.lastVisitTimestamp,
              endTimestamp: now
            });
          }
        }}
      >
        {appTitle}

        <TaskSwitcher
          setCurrentTaskId={this.setCurrentTaskId}
          idToken={this.state.idToken}
        />
        <Workspaces
          setCurrentWorkspaceId={this.setCurrentWorkspaceId}
          setCurrentSelectedPieceInTable={this.setCurrentSelectedPieceInTable}
          currentSelectedPieceInTable={this.state.currentSelectedPieceInTable}
          currentSelectedPieceInPieces={this.state.currentSelectedPieceInPieces}
          setCurrentSelectedPieceInPieces={this.setCurrentSelectedPieceInPieces}
          annotation_selected={this.state.annotation_selected}
          selected_annotation_id={this.state.selected_annotation_id}
        />
        <Pieces
          currentWorkspaceId={this.state.currentWorkspaceId}
          currentSelectedPieceInTable={this.state.currentSelectedPieceInTable}
          currentSelectedPieceInPieces={this.state.currentSelectedPieceInPieces}
          setCurrentSelectedPieceInPieces={this.setCurrentSelectedPieceInPieces}
          selected_annotation_id={this.state.selected_annotation_id}
        />
      </div>
    );
  }
}

export default DragDropContext(HTML5Backend)(Popup);
