import React, { Component } from 'react';
import firebase from '../../../../../firebase/firebase';
import StyledFirebaseAuth from 'react-firebaseui/StyledFirebaseAuth';
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
    signInOptions: [
      firebase.auth.GoogleAuthProvider.PROVIDER_ID
    ],
    callbacks: {
      // Avoid redirects after sign-in.
      signInSuccessWithAuthResult: () => false
    }
  };

  // Listen to the Firebase Auth state and set the local state.
  componentDidMount() {
    this.unregisterAuthObserver = firebase.auth().onAuthStateChanged(
        (user) => {
          this.setState({
            isSignedIn: !!user,
            user
          });
        }
    );
  }
  
  // Make sure we un-register Firebase observers when the component unmounts.
  componentWillUnmount() {
    this.unregisterAuthObserver();
  }

  render () {
    if (!this.state.isSignedIn) {
      return (
        <div className={styles.LoginPage}>
          <div className={styles.WelcomeCardContainer}>
            <div className={styles.WelcomeCard}>
              <div style={{textAlign: 'center', fontSize: '1.3rem', fontWeight: '600'}}>
                Welcome to KAP!
              </div>
              <div>
                <strong>KAP</strong> helps you collect, organize, and use online resources while coding. 
                <br />
                Please Sign in with your Google account.
              </div>
            </div>
          </div>
          <StyledFirebaseAuth uiConfig={this.uiConfig} firebaseAuth={firebase.auth()}/>
        </div>
      );
    }
    return (
      <div></div>
    );
  }
}

export default LoginPage;