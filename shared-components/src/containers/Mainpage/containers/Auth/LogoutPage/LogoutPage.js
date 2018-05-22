import React, { Component } from 'react';
import firebase from '../../../../../firebase/firebase';
import Spinner from '../../../../../components/UI/Spinner/Spinner';

class LogoutPage extends Component {
  state = {
    redirect: false
  }

  componentWillMount() {
    firebase.auth().signOut();
  }

  render () {
    return (
      <div style={{ textAlign: "center", position: "absolute", top: "25%", left: "50%" }}>
        <Spinner size="40px"/>
      </div>
    );
  }
}

export default LogoutPage;