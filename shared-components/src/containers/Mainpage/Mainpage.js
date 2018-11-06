/* global chrome */
import React, { Component } from "react";
import { Route, Switch, withRouter, Redirect } from 'react-router-dom';
import qs from 'query-string';
import Spinner from '../../components/UI/Spinner/Spinner';
import Layout from './containers/Layout/Layout';
import AllTasksPage from './containers/AllTasksPage/AllTasksPage';
import CurrentTaskPage from './containers/CurrentTaskPage/CurrentTaskPage';
import LoginPage from './containers/Auth/LoginPage/LoginPage';
import LogoutPage from './containers/Auth/LogoutPage/LogoutPage';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import fasArrowCircleRight from '@fortawesome/fontawesome-free-solid/faArrowCircleRight';
import * as appRoutes from '../../shared/routes';
import HTML5Backend from 'react-dnd-html5-backend';
import { DragDropContext } from 'react-dnd';
import {
  tasksRef,
  currentTaskIdRef,
  lastTaskIdRef,
  codebasesRef,
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
import styles from './Mainpage.css';

// @DragDropContext(HTML5Backend)
class Mainpage extends Component {
  state = {
    homepage: appRoutes.CURRENT_TASK,
    currentTaskId: null,
    lastTaskId: null,
    tasks: [],
    tasksLoading: true,
    authenticated: false,
    loading: true,
    shouldDisplayAllPages: DEFAULT_SETTINGS.shouldDisplayAllPages
  }

  UNSAFE_componentWillMount() {
    this.removeAuthListerner = firebase.auth().onAuthStateChanged((user) => {
      if (user !== null) {
        setUserIdAndName(user.uid, user.displayName, user.photoURL);
        console.log("User token: " + user.uid)

        FirebaseStore.updateUserProfile(user.uid, user.displayName, user.photoURL, user.email);

        userPathInFirestore.onSnapshot((doc) => {
          if (doc.exists) {
            const { userSettings } = doc.data();
            if (userSettings !== undefined && userSettings.shouldDisplayAllPages !== undefined) {
              this.setState({
                shouldDisplayAllPages: userSettings.shouldDisplayAllPages
              });
            }
          }
        });

        this.syncWithEditorAndWindow(userId);
        this.loadTasks();
        this.updateInbackground();

        // ckeck if should load other tasks
        database.ref('users').child(userId).child('editor').child('taskToNavigateTo').on('value', (snapshot) => {
          if (snapshot.val() !== null) {
            this.props.history.push(`/tasks/${snapshot.val().userId}/${snapshot.val().taskId}/${snapshot.val().pieceId}`);
            database.ref('users').child(userId).child('editor').child('taskToNavigateTo').set(null);
          }
        });

        this.setState({
          authenticated: true,
          loading: false
        });
      } else {
        setUserIdAndName();
        this.syncWithEditorAndWindow(userId);
        this.loadTasks();
        this.updateInbackground();

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

  componentDidMount () {
    window.isInKAP = true;

    document.title = APP_NAME_SHORT;

    // deal with logout from pop up
    let query = qs.parse(window.location.search);
    if (query.shouldSignOut) {
      this.props.history.push(appRoutes.LOG_OUT);
      window.history.replaceState(
        {},
        document.title,
        '/newtab.html'
      );
    }
  }

  resetParameters = (userId) => {
    setUserIdAndName(userId, 'Master ' + userId);
    this.syncWithEditorAndWindow(userId);
    localStorage.setItem('userId', userId);
    localStorage.setItem('userName', userName);
    localStorage.setItem('userProfilePhotoURL', userProfilePhotoURL);
    this.loadTasks();
    this.updateInbackground();
  }

  syncWithEditorAndWindow = (userId) => {
    let msg = {
      secret: 'secret-transmission-from-iframe',
      type: 'SET_USER',
      payload: {
        userId: userId
      }
    };
    window.parent.postMessage(JSON.stringify(msg), '*');

    window.userId = userId;
    currentTaskIdRef.on('value', (snap) => {
      window.currentTaskId = snap.val();
      if (snap.val() !== undefined && snap.val() !== null) {
        tasksRef.child(snap.val()).child('name').once('value', (snapp) => {
          window.taskName = snapp.val();
        });
      }
    });
    // window.currentTaskIdRef = currentTaskIdRef;
    window.tasksRef = tasksRef;
    window.database = database;
  }

  updateInbackground () {
    if (window.chrome !== undefined && window.chrome.extension !== undefined) {
      // console.log('update in background');
      chrome.runtime.sendMessage({
        msg: 'RESET_USER_ID',
        payload: {
          userId,
          userName,
          userProfilePhotoURL
        }
      })
    }
  }

  loadTasks () {
    currentTaskIdRef.on('value', (snapshot) => {
      this.setState({currentTaskId: snapshot.val()});
      console.log("CurrentTaskId: " + snapshot.val());
    });
    lastTaskIdRef.on('value', (snapshot) => {
      this.setState({lastTaskId: snapshot.val()});
    });

    tasksRef.on('value', (snapshot) => {
      let transformedTasks = [];
      snapshot.forEach((childSnapshot) => {
        // ask users to log out and re-login to patch these new fields
        if (childSnapshot.val().taskOngoing === undefined) {
          FirebaseStore.switchTaskWorkingStatus(childSnapshot.key, true, false);
        }
        transformedTasks.push({
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
          debrief: childSnapshot.val().debrief,
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
        });
      });
      this.setState({
        tasks: transformedTasks,
        tasksLoading: false
      });


      let taskIds = transformedTasks.map((t) => {
        return t.id;
      });

      codebasesRef.on('value', (snapshot) => {
        let transformedTasksClone = JSON.parse(JSON.stringify(transformedTasks));
        snapshot.forEach((snap) => {
          let codebase = snap.val();
          let entries = codebase.entries;
          if (entries !== undefined && entries !== null) {
            for (let entryKey in entries) {
              let entry = entries[entryKey];
              let winningIdx = taskIds.indexOf(entry.taskId);
              if (winningIdx !== -1 && transformedTasksClone[winningIdx].pieces[entry.pieceId] !== undefined) {
                if (transformedTasksClone[winningIdx].pieces[entry.pieceId].codeUseInfo === undefined) {
                  transformedTasksClone[winningIdx].pieces[entry.pieceId].codeUseInfo = [
                    {
                      codebase: codebase.name,
                      codebaseId: snap.key,
                      useInfo: [{usedBy: entry.usedBy, content: entry.content, timestamp: entry.timestamp}]
                    }
                  ];
                } else {
                  let codeUseInfo = transformedTasksClone[winningIdx].pieces[entry.pieceId].codeUseInfo;
                  let isNewCodebase = true;
                  codeUseInfo = codeUseInfo.map((use) => {
                    if (use.codebaseId === snap.key) {
                      use.useInfo.push({usedBy: entry.usedBy, content: entry.content, timestamp: entry.timestamp});
                      isNewCodebase = false;
                    }
                    return use;
                  });
                  if (isNewCodebase) {
                    codeUseInfo.push({
                      codebase: codebase.name,
                      codebaseId: snap.key,
                      useInfo: [{usedBy: entry.usedBy, content: entry.content, timestamp: entry.timestamp}]
                    });
                  }
                }
              }
            }
          }
        });
        // console.log(transformedTasksClone);
        this.setState({tasks: transformedTasksClone});
      });
    });
  }

  navigateToLastTask = (event, id) => {
    event.preventDefault();
    FirebaseStore.setCurrentTask(id);
    // rerouting
    this.props.history.push(appRoutes.CURRENT_TASK);
  }

  render () {

    if (this.state.loading === true) {
      return (
        <div style={{ textAlign: "center", position: "absolute", top: "25%", left: "50%" }}>
          <Spinner size="40px"/>
        </div>
      )
    }

    const { currentTaskId, tasks, lastTaskId } = this.state;

    let currentTaskName = null;
    let lastTaskName = null;
    let currentTaskObject = {};
    if (currentTaskId && tasks.length > 0) {
      let filteredTasks = tasks.filter(t => t.id === currentTaskId);
      if (filteredTasks.length > 0) {
        currentTaskName = filteredTasks[0].displayName;
        currentTaskObject = filteredTasks[0];
      } else {
        currentTaskName = 'No active tasks right now...'
      }
    }

    if (lastTaskId && tasks.length > 0) {
      let filteredTasks = tasks.filter(t => t.id === lastTaskId);
      if (filteredTasks.length > 0) {
        lastTaskName = filteredTasks[0].displayName;
      }
    }

    if (tasks.length === 0) {
      currentTaskName = 'No active tasks right now...';
    }

    let routes = (
      <Switch>
        <Route exact path={appRoutes.LOG_IN} component={LoginPage}/>
        <Redirect to={appRoutes.LOG_IN} />
      </Switch>
    );

    if (this.state.authenticated) {
      routes = (
        <Switch>
          <Route exact path={appRoutes.LOG_OUT} component={LogoutPage} />
          {
            tasks.length > 0
            ? <Route path={appRoutes.CURRENT_TASK} render={
                (routeProps) => (<CurrentTaskPage {...routeProps} task={currentTaskObject} specific={false} shouldDisplayAllPages={this.state.shouldDisplayAllPages}/>)
              } />
            : null
          }
          <Route path={appRoutes.ALL_TASKS} render={
            (routeProps) => (<AllTasksPage {...routeProps} tasks={tasks} currentTaskId={currentTaskId}/>)
          }/>
          {
            tasks.length > 0
            ? <Route path={appRoutes.TASK_WITH_ID} render={
                (routeProps) => (<CurrentTaskPage {...routeProps} specific={true} database={database}/>)
              } />
            : null
          }
          {
            tasks.length > 0
            ? <Redirect to={this.state.homepage} />
            : null
          }
        </Switch>
      );
    }



    return (
      <div>
        <Layout
          authenticated={this.state.authenticated}
          currentTaskName={currentTaskName}
          currentTaskId={currentTaskId}
          tasksLoading={this.state.tasksLoading}
          thereIsTask={tasks.length > 0}
          userName={userName}
          userProfilePhotoURL={userProfilePhotoURL}
          userId={userId}
          resetParameters={this.resetParameters}

          >
          {routes}

        </Layout>
        {
          lastTaskId
          ? <div
              onClick={(event) => this.navigateToLastTask(event, lastTaskId)}
              className={styles.LastTaskNavigationContainer}>
              Last task: &nbsp;
              <span>
                {lastTaskName}
              </span> &nbsp;
              <FontAwesomeIcon icon={fasArrowCircleRight}/>
            </div>
          : null
        }
      </div>
    );
  }
}

export default withRouter(DragDropContext(HTML5Backend)(Mainpage));
