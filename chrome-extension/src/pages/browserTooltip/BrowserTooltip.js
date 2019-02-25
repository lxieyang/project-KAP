/* global chrome */
import React, { Component } from 'react';
import firebase from '../../../../shared-components/src/firebase/firebase';
import { getFirstName } from '../../../../shared-components/src/shared/utilities';
import styles from './BrowserTooltip.css';

import NotLoggedIn from './containers/NotLoggedIn/NotLoggedIn';
import LoggedIn from './containers/LoggedIn/LoggedIn';

class BrowserTooltip extends Component {
  state = {
    userName: null,
    userProfilePhotoURL: null,

    loadingUserInfo: true
  };

  componentDidMount() {
    chrome.runtime.sendMessage(
      { msg: 'GET_USER_INFO', from: 'browserTooltip' },
      response => {
        let idToken = response.idToken;
        if (idToken === null || idToken === undefined) {
          // not logged in
          this.setState({
            loadingUserInfo: false,
            userName: null,
            userProfilePhotoURL: null
          });
        } else {
          // logged in
          chrome.storage.local.get(['user'], result => {
            let user = result.user;
            this.setState({
              loadingUserInfo: false,
              userName: user.displayName,
              userProfilePhotoURL: user.photoURL
            });
          });
        }
      }
    );
  }

  render() {
    if (this.state.loadingUserInfo) {
      return null;
    }

    let isLoggedIn = !(
      this.state.userName === null || this.state.userName === 'invalid'
    );

    return <NotLoggedIn />;

    if (!isLoggedIn) {
      return <NotLoggedIn />;
    } else {
      return (
        <LoggedIn
          userName={this.state.userName}
          photoURL={this.state.photoURL}
        />
      );
    }
  }
}

export default BrowserTooltip;
