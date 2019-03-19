/* global chrome */
import React, { Component } from 'react';
import firebase from '../../../../shared-components/src/firebase/firebase';
import {
  getFirstName,
  googleIcon
} from '../../../../shared-components/src/shared/utilities';
import { APP_NAME_SHORT } from '../../../../shared-components/src/shared/constants';

import Logo from '../../../../shared-components/src/components/UI/Logo/Logo';

import { withStyles } from '@material-ui/core/styles';
import Avatar from '@material-ui/core/Avatar';
import Chip from '@material-ui/core/Chip';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';

import Logout from 'mdi-material-ui/LogoutVariant';

import styles from './Auth.css';

const materialStyles = {
  card: {
    maxWidth: 400
  },
  media: {
    height: 140
  }
};

class Auth extends Component {
  state = {
    userName: null,
    userProfilePhotoURL: null,

    loadingUserInfo: true
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

  logInClickedHandler = () => {
    // this.setState({ loadingUserInfo: true });
    let provider = new firebase.auth.GoogleAuthProvider();
    firebase
      .auth()
      .signInWithPopup(provider)
      .then(function(result) {
        chrome.runtime.sendMessage({
          msg: 'USER_LOGGED_IN',
          from: 'auth_page',
          credential: result.credential,
          user: result.user
        });
      })
      .catch(function(error) {
        console.log(error);
        this.setState({ loadingUserInfo: false });
      });
  };

  logOutClickedHandler = () => {
    // this.setState({ loadingUserInfo: true });
    chrome.runtime.sendMessage({
      msg: 'USER_LOGGED_OUT',
      from: 'auth_page'
    });
  };

  render() {
    const { classes } = this.props;
    if (this.state.loadingUserInfo) {
      return null;
    }

    let isLoggedIn = !(
      this.state.userName === null || this.state.userName === 'invalid'
    );

    let returnVal = null;

    if (!isLoggedIn) {
      returnVal = (
        <React.Fragment>
          <div
            style={{
              width: '100%',
              height: '400px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <Card className={classes.card}>
              <CardContent>
                <Typography
                  gutterBottom
                  variant="h5"
                  component="h2"
                  style={{ display: 'flex', alignItems: 'center' }}
                >
                  <Logo size={'28px'} /> &nbsp; Welcome to {APP_NAME_SHORT}!
                </Typography>
                <Typography component="p">
                  <strong>{APP_NAME_SHORT}</strong> helps you collect and
                  organize online resources into meaningful structures while
                  programming.
                </Typography>
                <Typography
                  component="p"
                  style={{ display: 'flex', alignItems: 'center' }}
                >
                  Please log in with your Google account.
                </Typography>
              </CardContent>
              <CardContent>
                <Chip
                  avatar={<Avatar alt="G" src={googleIcon} />}
                  label="Log in with Google"
                  onClick={() => this.logInClickedHandler()}
                />
              </CardContent>
            </Card>
          </div>
        </React.Fragment>
      );
    } else {
      returnVal = (
        <React.Fragment>
          <div
            style={{
              width: '100%',
              height: '400px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <Card className={classes.card}>
              <CardContent>
                <Typography
                  gutterBottom
                  variant="h5"
                  component="h2"
                  style={{ display: 'flex', alignItems: 'center' }}
                >
                  <Logo size={'28px'} /> &nbsp;
                  {APP_NAME_SHORT}
                </Typography>
                <Typography component="p">
                  <strong>{APP_NAME_SHORT}</strong> helps you collect and
                  organize online resources into meaningful structures while
                  programming.
                </Typography>
                <Typography
                  component="p"
                  style={{ display: 'flex', alignItems: 'center' }}
                >
                  Currently logged in as
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
                      width: '24px',
                      height: '24px',
                      margin: '0px 4px'
                    }}
                  />
                  <span>{this.state.userName}</span>.
                </Typography>
              </CardContent>
              <CardContent>
                <Chip
                  avatar={
                    <Avatar>
                      <Logout />
                    </Avatar>
                  }
                  label={`Log out ${APP_NAME_SHORT}`}
                  onClick={() => this.logOutClickedHandler()}
                />
              </CardContent>
            </Card>
          </div>
        </React.Fragment>
      );
    }

    return <div className={styles.AuthPageContainer}>{returnVal}</div>;
  }
}

export default withStyles(materialStyles)(Auth);
