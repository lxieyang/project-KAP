/* global chrome */
import React, { Component } from 'react';
import firebase from '../../../../shared-components/src/firebase/firebase';
import { getFirstName } from '../../../../shared-components/src/shared/utilities';
import { APP_NAME_SHORT } from '../../../../shared-components/src/shared/constants';
import Logo from '../../../../shared-components/src/components/UI/Logo/Logo';

import styles from './BrowserTooltip.css';

import NotLoggedIn from './containers/NotLoggedIn/NotLoggedIn';
import LoggedIn from './containers/LoggedIn/LoggedIn';

import Divider from '@material-ui/core/Divider';

class BrowserTooltip extends Component {
  state = {
    userName: null,
    userProfilePhotoURL: null,

    loadingUserInfo: true,

    hostname: null,
    url: null,
    shouldTrack: false
  };

  componentDidMount() {
    chrome.runtime.sendMessage(
      { msg: 'GET_USER_INFO', from: 'browserTooltip' },
      response => {
        this.retrieveLoginInfo(response.idToken);
      }
    );

    chrome.runtime.sendMessage(
      {
        msg: 'GET_TRACKING_STATUS',
        from: 'browserTooltip'
      },
      response => {
        let { hostname, url, shouldTrack } = response;
        this.setState({
          hostname,
          url,
          shouldTrack
        });
      }
    );
  }

  retrieveLoginInfo = idToken => {
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
  };

  render() {
    let isLoggedIn = !(
      this.state.userName === null || this.state.userName === 'invalid'
    );

    let header = (
      <React.Fragment>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '10px 18px'
          }}
        >
          <Logo size="24px" /> &nbsp;{' '}
          <span style={{ fontSize: '20px', fontWeight: 600, flexGrow: 1 }}>
            {APP_NAME_SHORT}
          </span>
          {!this.state.loadingUserInfo && isLoggedIn ? (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <img
                src={this.state.userProfilePhotoURL}
                onError={e => {
                  e.target.onerror = null;
                  e.target.src = `https://ui-avatars.com/api/?name=${
                    this.state.userName
                  }?bold=true`;
                }}
                alt="avatar"
                style={{
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  margin: '0px 4px'
                }}
              />
              <span style={{ fontWeight: 300 }}>
                {getFirstName(this.state.userName)}
              </span>
            </div>
          ) : null}
        </div>
        <Divider />
      </React.Fragment>
    );

    let body = null;
    if (!isLoggedIn) {
      body = <NotLoggedIn />;
    } else {
      body = (
        <LoggedIn
          userName={this.state.userName}
          photoURL={this.state.photoURL}
          hostname={this.state.hostname}
          url={this.state.url}
          shouldTrack={this.state.shouldTrack}
        />
      );
    }

    let returnVal = header;

    if (this.state.loadingUserInfo) {
      returnVal = header;
    } else {
      returnVal = (
        <React.Fragment>
          {header}
          {body}
        </React.Fragment>
      );
    }

    return <div className={styles.BrowserTooltipContainer}>{returnVal}</div>;
  }
}

export default BrowserTooltip;
