/* global chrome */
import React, { Component } from 'react';
import firebase from '../../../../shared-components/src/firebase/firebase';
import { RadioGroup, Radio } from 'react-radio-group';

import Divider from '@material-ui/core/Divider';

import styles from './Options.css';
import Header from './components/Header/Header';

class Options extends Component {
  state = {
    accessToken: null,
    userName: null,
    userProfilePhotoURL: null,

    loadingUserInfo: true,

    version: '2',

    // settings
    sidebarBehavior: 'overlay',
    sidebarEscapeKeyToggle: true
  };

  componentDidMount() {
    this.setState({ version: chrome.app.getDetails().version });

    chrome.identity.getAuthToken({ interactive: true }, token => {
      this.signInOutUserWithCredential(token);
    });

    // chrome.runtime.sendMessage(
    //   { msg: 'GET_USER_INFO', from: 'auth' },
    //   response => {
    //     this.retrieveLoginInfo(response.idToken);
    //   }
    // );

    // // authenticate upon signin
    // chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    //   if (request.msg === 'USER_LOGIN_STATUS_CHANGED') {
    //     this.retrieveLoginInfo(request.idToken);
    //   }
    // });

    chrome.runtime.sendMessage({ msg: 'SHOULD_SHRINK_BODY' }, response => {
      let shouldShrinkBody = response.SHOULD_SHRINK_BODY;
      this.setState({
        sidebarBehavior: shouldShrinkBody ? 'shrinkbody' : 'overlay'
      });
    });

    chrome.runtime.sendMessage(
      { msg: 'SHOULD_TOGGLE_SIDEBAR_WITH_ESC_KEY' },
      response => {
        let shouldUseEscapeKeyToToggleSidebar =
          response.SHOULD_TOGGLE_SIDEBAR_WITH_ESC_KEY;
        this.setState({
          sidebarEscapeKeyToggle: shouldUseEscapeKeyToToggleSidebar
        });
      }
    );
  }

  signInOutUserWithCredential = accessToken => {
    this.setState({ accessToken });
    if (accessToken !== null) {
      // logged in
      firebase
        .auth()
        .signInAndRetrieveDataWithCredential(
          firebase.auth.GoogleAuthProvider.credential(null, accessToken)
        )
        // .signInAndRetrieveDataWithCredential(
        //   firebase.auth.GoogleAuthProvider.credential(accessToken)
        // )
        .then(result => {
          console.log('logged in');
          // let user = result.user;
          const { user } = result;
          this.setState({
            userName: user.displayName,
            userProfilePhotoURL: user.photoURL,
            loadingUserInfo: false
          });
        })
        .catch(error => {
          console.log(error);
          console.log(error.message);
          this.setState({ loadingUserInfo: false });
        });
    } else {
      // logged out
      firebase
        .auth()
        .signOut()
        .then(() => {
          this.setState({
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

  // retrieveLoginInfo = idToken => {
  //   if (idToken === null || idToken === undefined) {
  //     // not logged in

  //     this.setState({
  //       loadingUserInfo: false,
  //       userName: null,
  //       userProfilePhotoURL: null
  //     });

  //     // should redirect to auth page to log in
  //     setTimeout(() => {
  //       window.location.replace(chrome.extension.getURL('auth.html'));
  //     }, 2000);
  //   } else {
  //     // logged in
  //     chrome.storage.local.get(['user'], result => {
  //       let user = result.user;
  //       this.setState({
  //         loadingUserInfo: false,
  //         userName: user.displayName,
  //         userProfilePhotoURL: user.photoURL
  //       });
  //     });
  //   }
  // };

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
        <Header userName={userName} userProfilePhotoURL={userProfilePhotoURL} />

        <div className={styles.OptionsPageContainer}>
          <div className={styles.OptionContainer}>
            <div className={styles.OptionLabel}>Unakite version:</div>
            <a
              href="https://unakite.info/docs/get-started/overview"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className={styles.OptionOptions}>
                {this.state.version} (Documentation)
              </div>
            </a>
          </div>

          <Divider light />

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
                  Overlay on a webpage
                </label>
                <label>
                  <Radio value="shrinkbody" />
                  Shrink the body of a webpage
                </label>
              </RadioGroup>
            </div>
          </div>

          <div className={styles.OptionContainer}>
            <div className={styles.OptionLabel}>
              Use the keyboard shortcut <u>Ctrl + `</u> (also <u>Ctrl + Esc</u>{' '}
              on macOS) to toggle the sidebar:
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
