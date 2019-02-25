/* global chrome */
import React, { Component } from 'react';
import { APP_NAME_SHORT } from '../../../../../../shared-components/src/shared/constants';

class NotLoggedIn extends Component {
  state = {};

  goToAuthPage = () => {
    chrome.runtime.sendMessage({
      msg: 'GO_TO_AUTH_PAGE_TO_LOG_IN'
    });
  };

  render() {
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
          Please{' '}
          <span
            style={{ cursor: 'pointer' }}
            onClick={() => this.goToAuthPage()}
          >
            log in
          </span>{' '}
          to use {APP_NAME_SHORT}.
        </div>
      </React.Fragment>
    );
  }
}

export default NotLoggedIn;
