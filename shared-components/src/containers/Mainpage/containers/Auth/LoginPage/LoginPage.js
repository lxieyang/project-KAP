import React, { Component } from 'react';
import firebase from '../../../../../firebase/firebase';
import StyledFirebaseAuth from 'react-firebaseui/StyledFirebaseAuth';
import { APP_NAME_SHORT } from '../../../../../shared/constants';
import Logo from '../../../../../components/UI/Logo/Logo';
import styles from './LoginPage.css';

class LoginPage extends Component {
  // The component's Local state.
  state = {
    isSignedIn: false, // Local signed-in state.
    user: null
  };

  // Configure FirebaseUI.
  uiConfig = {
    // Popup signin flow rather than redirect flow.
    signInFlow: 'popup',
    // We will display Google and Facebook as auth providers.
    signInOptions: [firebase.auth.GoogleAuthProvider.PROVIDER_ID],
    callbacks: {
      // Avoid redirects after sign-in.
      signInSuccessWithAuthResult: () => false
    }
  };

  // Listen to the Firebase Auth state and set the local state.
  componentDidMount() {
    this.unregisterAuthObserver = firebase.auth().onAuthStateChanged(user => {
      this.setState({
        isSignedIn: !!user,
        user
      });
    });
  }

  // Make sure we un-register Firebase observers when the component unmounts.
  componentWillUnmount() {
    this.unregisterAuthObserver();
  }

  render() {
    if (!this.state.isSignedIn) {
      return (
        <div className={styles.LoginPage}>
          <div className={styles.WelcomeCardContainer}>
            <div className={styles.WelcomeCard}>
              <div
                style={{
                  textAlign: 'center',
                  fontSize: '1.3rem',
                  fontWeight: '600'
                }}
              >
                Welcome to {APP_NAME_SHORT}!
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginTop: '10px'
                }}
              >
                <Logo size={'30px'} />
              </div>
              <br />
              <div>
                <strong>{APP_NAME_SHORT}</strong> helps you collect and organize
                online resources into meaningful structures while programming.
                <br />
                Please Sign in with your Google account.
              </div>
            </div>
          </div>
          <StyledFirebaseAuth
            uiConfig={this.uiConfig}
            firebaseAuth={firebase.auth()}
          />
        </div>
      );
    }
    return <div />;
  }
}

export default LoginPage;
