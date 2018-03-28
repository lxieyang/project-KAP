/* global chrome */
import React, { Component } from "react";
import { Route, Switch, withRouter, Redirect } from 'react-router-dom';
// import qs from 'query-string';
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
  userId,
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

    // setTimeout(() => {
    //   let qsObj = qs.parse(this.props.location.search);
    //   console.log(qsObj);
    //   if (qsObj.userId !== undefined && qsObj.userName !== undefined) {
    //     setUserIdAndName(qsObj.userId, qsObj.userName);
    //     // console.log(tasksRef);
    //   }

    //   console.log(tasksRef.path.pieces_);
    //   this.loadTasks();
    // }, 6000);
    
    let userIdCached = localStorage.getItem('userId');
    if (userIdCached !== null) {
      setUserIdAndName(userIdCached, 'Master ' + userIdCached);
      this.syncWithEditor(userId);
    }

    this.loadTasks();
    this.updateInbackground();
  }

  resetParameters = (userId) => {
    setUserIdAndName(userId, 'Master ' + userId);
    this.syncWithEditor(userId);
    localStorage.setItem('userId', userId);
    this.loadTasks();
    this.updateInbackground();
  }

  syncWithEditor = (userId) => {
    let msg = {
      secret: 'secret-transmission-from-iframe',
      type: 'SET_USER',
      payload: {
        userId: userId
      }
    };
    window.parent.postMessage(JSON.stringify(msg), '*');
    console.log(msg);
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
    console.log('loading tasks');

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
        })
      });
      this.setState({tasks: transformedTasks});
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
          (routeProps) => (<CurrentTaskPage {...routeProps} task={currentTaskObject}/>)
        } />
        <Route path={appRoutes.ALL_TASKS} render={
          (routeProps) => (<AllTasksPage {...routeProps} tasks={tasks} />)
        }/>
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
