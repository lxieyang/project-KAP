/* global chrome */
import React, { Component } from 'react';

import { withStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Avatar from '@material-ui/core/Avatar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import MenuItem from '@material-ui/core/MenuItem';
import Menu from '@material-ui/core/Menu';
import Logout from 'mdi-material-ui/LogoutVariant';

import Logo from '../../../../../../shared-components/src/components/UI/Logo/Logo';
import ProfileImg from '../../../../../../shared-components/src/assets/images/profile-img.png';
import { APP_NAME_SHORT } from '../../../../../../shared-components/src/shared/constants';
import { getFirstName } from '../../../../../../shared-components/src/shared/utilities';

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
    padding: 6,
    borderRadius: 4,
    margin: '4px 4px'
  },
  userAvatar: {
    width: 22,
    height: 22
  },
  username: {
    marginLeft: 4,
    fontWeight: 300,
    fontSize: 16
  },
  menuItem: {
    padding: '4px 8px',
    fontWeight: 300
  }
};

class Header extends Component {
  state = {
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
      msg: 'USER_LOGGED_OUT'
    });
  };

  render() {
    const { userName, userProfilePhotoURL } = this.props;

    const { classes } = this.props;
    const { anchorEl } = this.state;
    const open = Boolean(anchorEl);

    return (
      <AppBar position="static" color="default">
        <Toolbar className={classes.toolbar} title={APP_NAME_SHORT}>
          <Avatar alt="app" className={classes.appAvatar}>
            <Logo size="30px" />
          </Avatar>

          <Typography
            variant="h6"
            color="inherit"
            className={classes.pageTitle}
          >
            Settings
          </Typography>

          <Typography variant="h6" color="inherit" className={classes.grow} />

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
                src={userProfilePhotoURL ? userProfilePhotoURL : ProfileImg}
                onError={e => {
                  e.target.onerror = null;
                  e.target.src = `https://ui-avatars.com/api/?name=${userName}?bold=true`;
                }}
                className={classes.userAvatar}
              />
              <div className={classes.username}>{getFirstName(userName)}</div>
            </IconButton>

            {/* <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right'
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right'
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
            </Menu> */}
          </div>
        </Toolbar>
      </AppBar>
    );
  }
}

export default withStyles(materialStyles)(Header);
