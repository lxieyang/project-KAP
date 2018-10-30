/* global chrome */
import React, { Component } from "react";
import { Route, Switch, withRouter, Redirect } from 'react-router-dom';
import qs from 'query-string';
import Spinner from '../../components/UI/Spinner/Spinner';
import Layout from './containers/Layout/Layout';
import CurrentTaskPage from './containers/CurrentTaskPage/CurrentTaskPage';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import fasArrowCircleRight from '@fortawesome/fontawesome-free-solid/faArrowCircleRight';
import * as appRoutes from '../../shared/routes';
import HTML5Backend from 'react-dnd-html5-backend';
import { DragDropContext } from 'react-dnd';
import {
  tasksRef,
  currentTaskIdRef,
  userId,
  userName,
  userProfilePhotoURL,
  database,
  setUserIdAndName,
  userPathInFirestore
} from '../../firebase/index';
import firebase from '../../firebase/firebase';
import * as FirebaseStore from '../../firebase/store';
import { APP_NAME_SHORT, DEFAULT_SETTINGS } from '../../shared/constants';
import styles from './ShowOffMainpage.css';


class Mainpage extends Component {
  state = {
    homepage: appRoutes.CURRENT_TASK,
    currentTaskId: null,
    tasks: [],
    currentTaskObj: {},
    tasksLoading: true,
    authenticated: false,
  }

  componentDidMount () {
    window.isInKAP = true;

    document.title = APP_NAME_SHORT;

    let query = qs.parse(window.location.search);
    console.log(query)
    setUserIdAndName(query.accessToken);
    this.setState({currentTaskId: query.taskId});
    this.loadCurrentTask(query.taskId);
  }

  resetParameters = (userId) => {
    console.log('Temporarily disabled')
  }

  loadCurrentTask (taskId) {
    tasksRef.child(taskId).once('value', (childSnapshot) => {
      let taskObj = {
        id: childSnapshot.key,
        visibility: childSnapshot.val().visibility,
        taskOngoing:
          childSnapshot.val().taskOngoing === undefined
          ? true
          : childSnapshot.val().taskOngoing,
        completionTimestamp:
          childSnapshot.val().taskOngoing === false
          ? childSnapshot.val().completionTimestamp
          : null,
        displayName: childSnapshot.val().name,
        time: childSnapshot.val().timestamp,
        searchQueries: childSnapshot.val().searchQueries,
        showOptionNotes: childSnapshot.val().showOptionNotes,
        options: (
          childSnapshot.val().options === undefined
          ? {}
          : childSnapshot.val().options
        ),
        pieces: (
          childSnapshot.val().pieces === undefined
          ? {}
          : childSnapshot.val().pieces
        ),
        requirements: (
          childSnapshot.val().requirements === undefined
          ? {}
          : childSnapshot.val().requirements
        ),
        pieceGroups: (
          childSnapshot.val().pieceGroups === undefined
          ? {}
          : childSnapshot.val().pieceGroups
        ),
        isStarred: childSnapshot.val().isStarred,
        currentOptionId: childSnapshot.val().currentOptionId,
        pageCountList: (
          childSnapshot.val().pageCountList === undefined
          ? {}
          : childSnapshot.val().pageCountList
        )
      };
      this.setState({
        currentTaskObj: taskObj,
        tasksLoading: false
      })
    });
  }

  componentDidCatch(error, info) {
    console.log(error);
    console.log(info);
  }

  render () {

    if (this.state.tasksLoading === true) {
      return (
        <div style={{ textAlign: "center", position: "absolute", top: "25%", left: "50%" }}>
          <Spinner size="40px"/>
        </div>
      )
    }

    const { currentTaskId } = this.state;

    let currentTaskObject = this.state.currentTaskObj;
    let currentTaskName = currentTaskObject.displayName;

    let routes = (
      <Route path={appRoutes.CURRENT_TASK} render={
        (routeProps) => (<CurrentTaskPage {...routeProps} task={currentTaskObject} specific={false} shouldDisplayAllPages={false} showoff={true}/>)
      } />
    );


    return (
      <div>
        <Layout
          authenticated={this.state.authenticated}
          currentTaskName={currentTaskName}
          currentTaskId={currentTaskId}
          tasksLoading={this.state.tasksLoading}
          thereIsTask={true}
          userName={userName}
          userProfilePhotoURL={userProfilePhotoURL}
          userId={userId}
          resetParameters={this.resetParameters}
          showoff={true}
          >
          {routes}

        </Layout>
      </div>
    );
  }
}

export default withRouter(DragDropContext(HTML5Backend)(Mainpage));
