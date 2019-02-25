/* global chrome */
import React, { Component } from 'react';
import { APP_NAME_SHORT } from '../../../../../../shared-components/src/shared/constants';
import { getFirstName } from '../../../../../../shared-components/src/shared/utilities';

class LoggedIn extends Component {
  state = {};

  logoutClickedHandler = () => {
    chrome.runtime.sendMessage({
      msg: 'GO_TO_AUTH_PAGE_TO_LOG_IN'
    });
  };

  render() {
    const { userName, photoURL } = this.props;
    return (
      <React.Fragment>
        <div
          style={{
            width: '100%',
            height: '200px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          Logged in as {getFirstName(userName)}
        </div>
        <div
          style={{
            width: '100%',
            height: '100px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <span
            style={{ cursor: 'pointer' }}
            onClick={() => this.logoutClickedHandler()}
          >
            log out
          </span>
        </div>
      </React.Fragment>
    );
  }
}

export default LoggedIn;
