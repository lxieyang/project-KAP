/* global chrome */
import React, { Component } from 'react';
import { RadioGroup, Radio } from 'react-radio-group';
import styles from './Options.css';
import SelectTooltipButton from '../content/SelectTooltipButton/SelectTooltipButton';

class Options extends Component {
  state = {
    userName: null,
    userProfilePhotoURL: null,

    loadingUserInfo: true,

    // settings
    sidebarBehavior: 'overlay',
    sidebarEscapeKeyToggle: true
  };

  componentDidMount() {
    chrome.runtime.sendMessage(
      { msg: 'GET_USER_INFO', from: 'auth' },
      response => {
        this.retrieveLoginInfo(response.idToken);
      }
    );

    // authenticate upon signin
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.msg === 'USER_LOGIN_STATUS_CHANGED') {
        this.retrieveLoginInfo(request.idToken);
      }
    });

    chrome.runtime.sendMessage({ msg: 'SHOULD_SHRINK_BODY' }, response => {
      let shouldShrinkBody = response.SHOULD_SHRINK_BODY;
      this.setState({
        sidebarBehavior: shouldShrinkBody ? 'shrinkbody' : 'overlay'
      });
    });

    chrome.runtime.sendMessage(
      { msg: 'SHOULD_SHSHOULD_TOGGLE_SIDEBAR_WITH_ESC_KEYRINK_BODY' },
      response => {
        let shouldUseEscapeKeyToToggleSidebar =
          response.SHOULD_TOGGLE_SIDEBAR_WITH_ESC_KEY;
        this.setState({
          sidebarEscapeKeyToggle: shouldUseEscapeKeyToToggleSidebar
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

      // should redirect to auth page to log in
      setTimeout(() => {
        window.location.replace(chrome.extension.getURL('auth.html'));
      }, 2000);
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

  handleSidebarBehaviorChange = value => {
    this.setState({ sidebarBehavior: value });
    chrome.runtime.sendMessage({
      msg: 'SETTINGS_CHANGED_SIDEBAR_BEHAVIOR',
      to: value
    });
  };

  handleSidebarEscapeKeyToggleChange = value => {
    this.setState({ sidebarEscapeKeyToggle: value });
    chrome.runtime.sendMessage({
      msg: 'SETTINGS_CHANGED_SIDEBAR_ESCAPE_KEY_TOGGLE',
      to: value
    });
  };

  render() {
    const { loadingUserInfo, userName, userProfilePhotoURL } = this.state;
    if (loadingUserInfo) {
      return null;
    }

    if (!loadingUserInfo && userName === null) {
      return (
        <div className={styles.RedirectingPromptContainer}>
          Redirecting to log in page...
        </div>
      );
    }

    return (
      <React.Fragment>
        <div className={styles.OptionsPageContainer}>
          <div className={styles.OptionContainer}>
            <div className={styles.OptionLabel}>Sidebar open behavior:</div>
            <div className={styles.OptionOptions}>
              <RadioGroup
                name="sidebar-behavior"
                selectedValue={this.state.sidebarBehavior}
                onChange={this.handleSidebarBehaviorChange}
              >
                <label>
                  <Radio value="overlay" />
                  Overlay on the webpage
                </label>
                <label>
                  <Radio value="shrinkbody" />
                  Shrink the body of the webpage
                </label>
              </RadioGroup>
            </div>
          </div>

          <div className={styles.OptionContainer}>
            <div className={styles.OptionLabel}>
              Use <u>Ctrl + Esc</u> to toggle sidebar:
            </div>
            <div className={styles.OptionOptions}>
              <RadioGroup
                name="sidebar-escape-key-toggle"
                selectedValue={this.state.sidebarEscapeKeyToggle}
                onChange={this.handleSidebarEscapeKeyToggleChange}
              >
                <label>
                  <Radio value={true} />
                  True
                </label>
                <label>
                  <Radio value={false} />
                  False
                </label>
              </RadioGroup>
            </div>
          </div>
        </div>
        {/*<div style={{ marginLeft: '200px' }}>
          <SelectTooltipButton />
        </div>*/}
      </React.Fragment>
    );
  }
}

export default Options;
