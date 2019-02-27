/* global chrome */
import React, { Component } from 'react';
import firebase from '../../../../shared-components/src/firebase/firebase';
import { getFirstName } from '../../../../shared-components/src/shared/utilities';
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

const googleIcon =
  'data:image/png;base64,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';

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
