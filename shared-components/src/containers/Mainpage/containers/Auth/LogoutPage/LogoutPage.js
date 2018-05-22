import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';
import * as appRoutes from '../../../../../shared/routes';
import firebase from '../../../../../firebase/firebase';

class LogoutPage extends Component {
  state = {
    redirect: false
  }

  componentWillMount() {
    firebase.auth().signOut().then((use) => {
      this.setState({ redirect: true });
    })
  }

  render () {
    if (this.state.redirect === true) {
      return <Redirect to={appRoutes.LOG_IN} />
    } 

    return (
      <div>
        <h1>Logging out ...</h1>
      </div>
    )
  }
}

export default LogoutPage;