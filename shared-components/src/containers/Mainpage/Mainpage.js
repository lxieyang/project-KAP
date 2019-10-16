/* global chrome */
import React, { Component } from 'react';
import queryString from 'query-string';
import { Route, Switch, withRouter, Redirect } from 'react-router-dom';
import Spinner from '../../components/UI/Spinner/Spinner';
import Layout from './containers/Layout/Layout';
import AllTasksPage from './containers/AllTasksPage/AllTasksPage';
import SingleTaskPage from './containers/SingleTaskPage/SingleTaskPage';
import LoginPage from './containers/Auth/LoginPage/LoginPage';
import LogoutPage from './containers/Auth/LogoutPage/LogoutPage';
import * as appRoutes from '../../shared/routes';
import HTML5Backend from 'react-dnd-html5-backend';
import { DragDropContext } from 'react-dnd';

import firebase from '../../firebase/firebase';
import * as FirestoreManager from '../../firebase/firestore_wrapper';
import { APP_NAME_SHORT } from '../../shared/constants';
import { getCleanURLOfCurrentPage } from '../../shared/utilities';

class Mainpage extends Component {
  state = {
    authenticated: false,

    homepage: appRoutes.ALL_TASKS,

    loginRedirect: null,

    loading: true,

    displayingTaskId: null,
    displayingTaskName: null,

    user: null
  };

  componentDidMount() {
    window.isInKAP = true;
    document.title = APP_NAME_SHORT;

    this.removeAuthListerner = firebase.auth().onAuthStateChanged(user => {
      if (user !== null) {
        // console.log('User token: ' + user.uid);
        FirestoreManager.updateUserProfile();

        this.setState({
          authenticated: true,
          user,
          loading: false
        });

        let redirect = this.state.loginRedirect;
        if (redirect) {
          this.setLoginRedirect(null);
          this.props.history.push({
            pathname: redirect,
            state: undefined
          });
        }
      } else {
        this.setState({
          authenticated: false,
          user: null,
          loading: false
        });
      }
    });

    // log in if oauthAccessToken is provided by the link
    let oauthAccessToken = queryString.parse(window.location.search)
      .oauthAccessToken;
    this.signInUserWithCredential(oauthAccessToken);
  }

  signInUserWithCredential = oauthAccessToken => {
    if (oauthAccessToken !== null && oauthAccessToken !== undefined) {
      // logged in
      firebase
        .auth()
        .signInAndRetrieveDataWithCredential(
          firebase.auth.GoogleAuthProvider.credential(null, oauthAccessToken)
        )
        .then(result => {
          // let user = result.user;
          let cleanUrl = getCleanURLOfCurrentPage();
          window.history.pushState({ path: cleanUrl }, '', cleanUrl);
        })
        .catch(error => {
          console.log(error);
        });
    }
  };

  componentWillUnmount() {
    this.removeAuthListerner();
  }

  setLoginRedirect = redirect => {
    this.setState({ loginRedirect: redirect });
  };

  setDisplayingTaskIdAndName = (taskId, taskName) => {
    this.setState({ displayingTaskId: taskId, displayingTaskName: taskName });
  };

  render() {
    let currentUser = FirestoreManager.getCurrentUser();

    if (this.state.loading === true) {
      return (
        <div
          style={{
            textAlign: 'center',
            position: 'absolute',
            top: '25%',
            left: '50%'
          }}
        >
          <Spinner size="40px" />
        </div>
      );
    }

    let routes = (
      <Switch>
        <Route
          path={appRoutes.TASK_WITH_ID}
          render={routeProps => (
            <SingleTaskPage
              {...routeProps}
              userId={this.state.user ? this.state.user.uid : null}
              setDisplayingTaskIdAndName={this.setDisplayingTaskIdAndName}
            />
          )}
        />
        <Route
          exact
          path={appRoutes.LOG_IN}
          render={routeProps => (
            <LoginPage setLoginRedirect={this.setLoginRedirect} />
          )}
        />
        <Redirect to={appRoutes.LOG_IN} />
      </Switch>
    );

    if (this.state.authenticated) {
      routes = (
        <Switch>
          <Route exact path={appRoutes.LOG_OUT} component={LogoutPage} />
          <Route
            path={appRoutes.TASK_WITH_ID}
            render={routeProps => (
              <SingleTaskPage
                {...routeProps}
                userId={this.state.user ? this.state.user.uid : null}
                setDisplayingTaskIdAndName={this.setDisplayingTaskIdAndName}
              />
            )}
          />
          <Route
            path={appRoutes.ALL_TASKS}
            render={routeProps => (
              <AllTasksPage
                {...routeProps}
                userId={this.state.user ? this.state.user.uid : null}
              />
            )}
          />

          <Redirect to={this.state.homepage} />
        </Switch>
      );
    }

    return (
      <div>
        <Layout
          authenticated={this.state.authenticated}
          currentTaskName={this.state.displayingTaskName}
          currentTaskId={this.state.displayingTaskId}
          tasksLoading={false}
          thereIsTask={true}
          userName={
            currentUser ? FirestoreManager.getCurrentUser().displayName : null
          }
          userProfilePhotoURL={
            currentUser ? FirestoreManager.getCurrentUser().photoURL : null
          }
          userId={currentUser ? FirestoreManager.getCurrentUserId() : null}
        >
          {routes}
        </Layout>
      </div>
    );
  }
}

export default withRouter(DragDropContext(HTML5Backend)(Mainpage));
