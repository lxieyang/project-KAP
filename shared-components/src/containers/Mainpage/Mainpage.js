/* global chrome */
import React, { Component } from "react";
import { Route, Switch, withRouter, Redirect } from 'react-router-dom';
import Layout from './containers/Layout/Layout';
import AllTasksPage from './containers/AllTasksPage/AllTasksPage';
import CurrentTaskPage from './containers/CurrentTaskPage/CurrentTaskPage';
import * as appRoutes from '../../shared/routes';
import HTML5Backend from 'react-dnd-html5-backend';
import { DragDropContext } from 'react-dnd';
import { capitalizeFirstLetter } from '../../shared/utilities';
import { 
  tasksRef,
  currentTaskIdRef,
  codebasesRef,
  userId,
  database,
  setUserIdAndName
} from '../../firebase/index';

@DragDropContext(HTML5Backend)
class Mainpage extends Component {
  state = {
    homepage: appRoutes.CURRENT_TASK,
    currentTaskId: null,
    tasks: []
  }

  componentDidMount () {    
    window.isInKAP = true;
    let userIdCached = localStorage.getItem('userId');
    if (userIdCached !== null) {
      setUserIdAndName(userIdCached, 'Master ' + userIdCached);
      
    }

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

  }

  resetParameters = (userId) => {
    setUserIdAndName(userId, 'Master ' + userId);
    this.syncWithEditorAndWindow(userId);
    localStorage.setItem('userId', userId);
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
    });
    // window.currentTaskIdRef = currentTaskIdRef;
    window.tasksRef = tasksRef;
    window.database = database;
  }

  updateInbackground () {
    if (window.chrome !== undefined && window.chrome.extension !== undefined) {
      console.log('update in background');
      chrome.runtime.sendMessage({
        msg: 'RESET_USER_ID',
        payload: {userId}
      })
    }
  }

  loadTasks () {
    
    currentTaskIdRef.on('value', (snapshot) => {
      this.setState({currentTaskId: snapshot.val()});
    });

    tasksRef.on('value', (snapshot) => {
      let transformedTasks = [];
      snapshot.forEach((childSnapshot) => {
        transformedTasks.push({
          id: childSnapshot.key,
          displayName: childSnapshot.val().name,
          time: childSnapshot.val().timestamp,
          searchQueries: childSnapshot.val().searchQueries,
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
      this.setState({tasks: transformedTasks});


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

  render () {
    const { currentTaskId, tasks } = this.state;

    let currentTaskName = null;
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

    let routes = (
      <Switch>
        <Route path={appRoutes.CURRENT_TASK} render={
          (routeProps) => (<CurrentTaskPage {...routeProps} task={currentTaskObject} specific={false}/>)
        } />
        <Route path={appRoutes.ALL_TASKS} render={
          (routeProps) => (<AllTasksPage {...routeProps} tasks={tasks} />)
        }/>
        <Route path={appRoutes.TASK_WITH_ID} render={
          (routeProps) => (<CurrentTaskPage {...routeProps} specific={true} database={database}/>)
        } />
        <Redirect to={this.state.homepage} />
      </Switch>
    )

    return (
      <div>
        <Layout 
          currentTaskName={currentTaskName} 
          userName={'Master ' + capitalizeFirstLetter(userId)}
          userId={userId}
          resetParameters={this.resetParameters}>
          {routes}
        </Layout>
      </div>
    );
  }
}

export default withRouter(Mainpage);
