/* global chrome */
import React, { Component } from 'react';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import fasExternalLinkSquareAlt from '@fortawesome/fontawesome-free-solid/faExternalLinkSquareAlt';

import AppHeader from '../../../../shared-components/src/components/UI/AppHeader/AppHeader';
import TaskSwitcher from './containers/TaskSwitcher/TaskSwitcher';
import Structure from './containers/Structure/Strusture';
import Pieces from './containers/Pieces/Pieces';
import styles from './Popup.css';
import { APP_NAME_SHORT } from '../../../../shared-components/src/shared/constants';
import Spinner from '../../../../shared-components/src/components/UI/Spinner/Spinner';
import firebase from '../../../../shared-components/src/firebase/firebase';

class Popup extends Component {
  state = {
    userId: null,
    userName: null,
    userProfilePhotoURL: null,

    loadingUserInfo: true
  };

  componentDidMount() {
    chrome.runtime.sendMessage({ msg: 'GET_USER_INFO' }, response => {
      this.signInOutUserWithCredential(response.idToken);
    });

    // authenticate upon signin
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.msg === 'USER_LOGIN_STATUS_CHANGED') {
        this.signInOutUserWithCredential(request.idToken);
      }
    });
  }

  signInOutUserWithCredential = idToken => {
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
      <React.Fragment>
        {appTitle}
        {/*<div
          style={{
            width: '100%',
            height: '100px',
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center'
          }}
        >
          Successfully logged into {APP_NAME_SHORT}.
        </div>*/}
        <TaskSwitcher />
        <Structure />
        <Pieces />
      </React.Fragment>
    );
  }
}

export default Popup;
