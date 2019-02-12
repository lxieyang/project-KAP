/* global chrome */
import React, { Component } from 'react';
import { matchPath } from 'react-router';
import { Route, Switch, withRouter, Redirect } from 'react-router-dom';
import qs from 'query-string';
import Spinner from '../../components/UI/Spinner/Spinner';
import Layout from './containers/Layout/Layout';
import AllTasksPage from './containers/AllTasksPage/AllTasksPage';
import CurrentTaskPage from './containers/CurrentTaskPage/CurrentTaskPage';
import SingleTaskPage from './containers/SingleTaskPage/SingleTaskPage';
import LoginPage from './containers/Auth/LoginPage/LoginPage';
import LogoutPage from './containers/Auth/LogoutPage/LogoutPage';
import * as appRoutes from '../../shared/routes';
import HTML5Backend from 'react-dnd-html5-backend';
import { DragDropContext } from 'react-dnd';

import firebase from '../../firebase/firebase';
import * as FirestoreManager from '../../firebase/firestore_wrapper';
import { APP_NAME_SHORT, DEFAULT_SETTINGS } from '../../shared/constants';

// @DragDropContext(HTML5Backend)
class Mainpage extends Component {
  state = {
    authenticated: false,

    homepage: appRoutes.ALL_TASKS,

    loading: true,

    displayingTaskId: null,
    displayingTaskName: null
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
          loading: false
        });
      } else {
        this.setState({
          authenticated: false,
          loading: false
        });
      }
    });
  }

  componentWillUnmount() {
    this.removeAuthListerner();
  }

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
        <Route exact path={appRoutes.LOG_IN} component={LoginPage} />
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
                setDisplayingTaskIdAndName={this.setDisplayingTaskIdAndName}
              />
            )}
          />
          <Route
            path={appRoutes.ALL_TASKS}
            render={routeProps => <AllTasksPage {...routeProps} />}
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
