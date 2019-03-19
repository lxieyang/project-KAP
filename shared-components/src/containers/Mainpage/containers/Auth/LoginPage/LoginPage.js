import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import firebase from '../../../../../firebase/firebase';
import { APP_NAME_SHORT } from '../../../../../shared/constants';
import { googleIcon } from '../../../../../shared/utilities';
import Logo from '../../../../../components/UI/Logo/Logo';

import { withStyles } from '@material-ui/core/styles';
import Avatar from '@material-ui/core/Avatar';
import Chip from '@material-ui/core/Chip';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';

import styles from './LoginPage.css';

const materialStyles = {
  card: {
    maxWidth: 400
  },
  media: {
    height: 140
  }
};

class LoginPage extends Component {
  // The component's Local state.
  state = {
    isSignedIn: false, // Local signed-in state.
    user: null,
    redirect: null
  };

  // Listen to the Firebase Auth state and set the local state.
  componentDidMount() {
    let redirect =
      this.props.location.state !== undefined &&
      this.props.location.state.shouldRedirectTo !== undefined
        ? this.props.location.state.shouldRedirectTo
        : null;
    this.setState({ redirect });
    this.props.setLoginRedirect(redirect);

    this.unregisterAuthObserver = firebase.auth().onAuthStateChanged(user => {
      this.setState({
        isSignedIn: !!user,
        user
      });
    });

    // console.log(this.props.location.state);
  }

  // Make sure we un-register Firebase observers when the component unmounts.
  componentWillUnmount() {
    this.unregisterAuthObserver();
  }

  logInClickedHandler = () => {
    let provider = new firebase.auth.GoogleAuthProvider();
    firebase
      .auth()
      .signInWithPopup(provider)
      .then(function(result) {})
      .catch(function(error) {
        console.log(error);
      });
  };

  render() {
    const { classes } = this.props;

    if (!this.state.isSignedIn) {
      return (
        <div className={styles.LoginPage}>
          <div
            style={{
              width: '100%',
              height: '350px',
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
        </div>
      );
    }
    return <div />;
  }
}

export default withRouter(withStyles(materialStyles)(LoginPage));
