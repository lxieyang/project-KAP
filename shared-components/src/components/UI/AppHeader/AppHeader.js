/* global chrome */
import React, { Component } from 'react';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import fasCog from '@fortawesome/fontawesome-free-solid/faCog';
import fasExternalLinkSquareAlt from '@fortawesome/fontawesome-free-solid/faExternalLinkSquareAlt';
import fasSignOutAlt from '@fortawesome/fontawesome-free-solid/faSignOutAlt';
import Popover from 'react-tiny-popover';
import ProfileImg from '../../../assets/images/profile-img.png';
import { APP_NAME_LONG, APP_NAME_SHORT } from '../../../shared/constants';
import { getFirstName } from '../../../shared/utilities';
import Spinner from '../../UI/Spinner/Spinner';
import Logo from '../Logo/Logo';
import styles from './AppHeader.css';

class AppHeader extends Component {
  state = {
    popoverOpen: false
  };

  switchPopoverOpenStatus = () => {
    this.setState(prevState => {
      return { popoverOpen: !prevState.popoverOpen };
    });
  };

  handleClose(e) {
    this.setState({ popoverOpen: false });
  }

  handleSignOut = () => {
    this.props.signOutClickedHandler();
  };

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.shouldDisplayHeaderButtons === false) {
      this.setState({ popoverOpen: false });
    }
  }

  openSettingsPageClickedHandler = () => {
    this.switchPopoverOpenStatus();
    setTimeout(() => {
      this.props.openSettingsPageClickedHandler();
    }, 50);
  };

  openInNewTabClickedHandler = () => {
    chrome.runtime.sendMessage({
      msg: 'Go_TO_ALL_TASKS_PAGE'
    });
  };

  render() {
    const props = this.props;
    return (
      <React.Fragment>
        <div
          className={[
            styles.AppHeader,
            props.shouldDisplayHeaderButtons
              ? styles.isLoggedIn
              : styles.isNotLoggedIn
          ].join(' ')}
        >
          <div
            className={styles.HeaderText}
            onClick={() => this.openInNewTabClickedHandler()}
          >
            <Logo size={props.logoSize} hover={props.hover} /> &nbsp;
            <strong>{APP_NAME_SHORT}</strong>
            &nbsp;
            <span className={styles.AppVersion}>v2</span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-around'
            }}
          >
            {props.shouldDisplayHeaderButtons === false ? (
              <div
                className={styles.SignInOutButtonInline}
                onClick={e => this.props.logInClickedHandler()}
              >
                Log in
              </div>
            ) : (
              <Popover
                containerStyle={{ zIndex: '100000' }}
                containerClassName={styles.LogoutPopoverContainer}
                isOpen={this.state.popoverOpen}
                position={'bottom'}
                align={'end'}
                onClickOutside={this.handleClose.bind(this)}
                content={
                  props.isSigningOut === true ? (
                    <div className={styles.SpinnerContainer}>
                      <Spinner size="25px" />
                    </div>
                  ) : (
                    <div className={styles.PopoverContentContainer}>
                      <ul>
                        <li
                          onClick={e => this.openSettingsPageClickedHandler()}
                        >
                          <div className={styles.IconBoxInPopover}>
                            <FontAwesomeIcon
                              icon={fasCog}
                              className={styles.IconInPopover}
                            />
                          </div>
                          <div>Settings</div>
                        </li>

                        <li onClick={e => this.props.logoutClickedHandler()}>
                          <div className={styles.IconBoxInPopover}>
                            <FontAwesomeIcon
                              icon={fasSignOutAlt}
                              className={styles.IconInPopover}
                            />
                          </div>
                          <div>Log out</div>
                        </li>
                      </ul>
                    </div>
                  )
                }
              >
                <div
                  title={'More...'}
                  className={styles.Profile}
                  onClick={() => this.switchPopoverOpenStatus()}
                >
                  <img
                    src={
                      props.userProfilePhotoURL !== null
                        ? props.userProfilePhotoURL
                        : ProfileImg
                    }
                    onError={e => {
                      e.target.onerror = null;
                      e.target.src = `https://ui-avatars.com/api/?name=${
                        props.userName
                      }?bold=true`;
                    }}
                    alt=""
                    className={styles.ProfileImg}
                  />
                  <span>{getFirstName(props.userName)}</span>
                </div>
              </Popover>
            )}
          </div>
        </div>
      </React.Fragment>
    );
  }
}

export default AppHeader;
