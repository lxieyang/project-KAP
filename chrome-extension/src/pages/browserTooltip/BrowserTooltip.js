/* global chrome */
import React, { Component } from 'react';
import firebase from '../../../../shared-components/src/firebase/firebase';
import { getFirstName } from '../../../../shared-components/src/shared/utilities';
import { APP_NAME_SHORT } from '../../../../shared-components/src/shared/constants';
import Logo from '../../../../shared-components/src/components/UI/Logo/Logo';

import styles from './BrowserTooltip.css';

import NotLoggedIn from './containers/NotLoggedIn/NotLoggedIn';
import LoggedIn from './containers/LoggedIn/LoggedIn';

import { withStyles } from '@material-ui/core/styles';
import Avatar from '@material-ui/core/Avatar';
import MenuItem from '@material-ui/core/MenuItem';
import Menu from '@material-ui/core/Menu';
import Logout from 'mdi-material-ui/LogoutVariant';
import IconButton from '@material-ui/core/IconButton';
import Divider from '@material-ui/core/Divider';

const materialStyles = {
  toolbar: {
    minHeight: 40,
    paddingLeft: 16,
    paddingRight: 12
  },
  appAvatar: {
    width: 30,
    height: 30
  },
  grow: {
    flexGrow: 1
  },
  pageTitle: {
    marginLeft: 10
  },
  iconButton: {
    padding: 4,
    borderRadius: 4
  },
  userAvatar: {
    width: 22,
    height: 22
  },
  username: {
    marginLeft: 4,
    fontWeight: 300,
    fontSize: 15
  },
  menuItem: {
    padding: '4px 8px',
    fontWeight: 300
  }
};

class BrowserTooltip extends Component {
  state = {
    userName: null,
    userProfilePhotoURL: null,

    loadingUserInfo: true,

    hostname: null,
    url: null,
    shouldTrack: false,

    anchorEl: null
  };

  handleMenu = event => {
    this.setState({ anchorEl: event.currentTarget });
  };

  handleClose = () => {
    this.setState({ anchorEl: null });
  };

  logoutClickedHandler = () => {
    chrome.runtime.sendMessage({
      msg: 'GO_TO_AUTH_PAGE'
    });
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

  allTasksClickedHandler = () => {
    chrome.runtime.sendMessage({
      msg: 'Go_TO_ALL_TASKS_PAGE'
    });
  };

  render() {
    const { classes } = this.props;
    const { anchorEl, userProfilePhotoURL, userName } = this.state;
    const open = Boolean(anchorEl);

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
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              cursor:
                !this.state.loadingUserInfo && isLoggedIn ? 'pointer' : null
            }}
            onClick={() => {
              if (!this.state.loadingUserInfo && isLoggedIn) {
                this.allTasksClickedHandler();
              }
            }}
          >
            <Logo size="24px" /> &nbsp;{' '}
            <span style={{ fontSize: '20px', fontWeight: 600, flexGrow: 1 }}>
              {APP_NAME_SHORT}
            </span>
          </div>
          <div style={{ flex: 1 }} />
          {!this.state.loadingUserInfo && isLoggedIn ? (
            <div>
              <IconButton
                aria-owns={open ? 'menu-appbar' : undefined}
                aria-haspopup="true"
                onClick={this.handleMenu}
                className={classes.iconButton}
                color="inherit"
              >
                <Avatar
                  alt="avatar"
                  src={userProfilePhotoURL}
                  onError={e => {
                    e.target.onerror = null;
                    e.target.src = `https://ui-avatars.com/api/?name=${userName}?bold=true`;
                  }}
                  className={classes.userAvatar}
                />
                <div className={classes.username}>{getFirstName(userName)}</div>
              </IconButton>

              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'left'
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'left'
                }}
                open={open}
                onClose={this.handleClose}
              >
                <MenuItem
                  onClick={() => {
                    this.logoutClickedHandler();
                    this.handleClose();
                  }}
                  className={classes.menuItem}
                >
                  <Logout /> &nbsp; Log out
                </MenuItem>
              </Menu>
            </div>
          ) : null}
        </div>
        <Divider light />
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

export default withStyles(materialStyles)(BrowserTooltip);
