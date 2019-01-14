/* global chrome */
import React, { Component } from 'react';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import fasExternalLinkSquareAlt from '@fortawesome/fontawesome-free-solid/faExternalLinkSquareAlt';

import AppHeader from '../../../../shared-components/src/components/UI/AppHeader/AppHeader';
import styles from './Popup.css';
import { APP_NAME_SHORT } from '../../../../shared-components/src/shared/constants';

class Popup extends Component {
  state = {
    userId: null,
    userName: null,
    userProfilePhotoURL: null
  };

  render() {
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
        isSigningOut={this.state.isSigningOut}
        signOutClickedHandler={this.signOutClickedHandler}
        openInNewTabClickedHandler={this.openInNewTabClickedHandler}
        openSettingsPageClickedHandler={this.openSettingsPageClickedHandler}
      />
    );

    let toRender = <div />;

    if (!isLoggedIn) {
      return (
        <React.Fragment>
          {appTitle}
          {/*<HorizontalDivider margin={dividerOptions.margin.none}/>*/}
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
  }
}

export default Popup;
