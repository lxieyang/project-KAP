/* global chrome */
import React, { Component } from "react";
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import fasExternalLinkSquareAlt from '@fortawesome/fontawesome-free-solid/faExternalLinkSquareAlt';
import Aux from '../../../../shared-components/src/hoc/Aux/Aux';
import AppHeader from '../../../../shared-components/src/components/UI/AppHeader/AppHeader';
import HorizontalDivider from '../../../../shared-components/src/components/UI/Divider/HorizontalDivider/HorizontalDivider';
import CurrentTask from './components/CurrentTask/CurrentTask';
import Options from './components/Options/Options';
import Requirements from './components/Requirements/Requirements';
import { DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import {
  tasksRef,
  currentTaskIdRef,
  setUserIdAndName
} from '../../../../shared-components/src/firebase/index';
import * as FirebaseStore from '../../../../shared-components/src/firebase/store';
import styles from './Popup.css';
import Snackbar from '../../../../shared-components/src/components/UI/Snackbar/Snackbar';


const dividerOptions = {
  margin: {
    long: '10px',
    short: '30px',
    none: '0px'
  }
}

@DragDropContext(HTML5Backend)
class Popup extends Component {
  state = {
    currentTaskId: null,
    tasks: [],
    newOptionInput: '',
    newRequirementInput: '',
    isEditingOption: true,
    isEditingRequirement: false,
    isEditingTaskName: false,
    currentTaskIdIsLoading: true,
    tasksIsLoading: true,
    loading: true,
    userId: null,
    userName: null,
    userProfilePhotoURL: null,
    isSigningOut: null,

    // chrome extension port
    portToBackground: null,

    // snackbar
    deleteOptionSnackbarShouldShow: false,
    deleteRequirementSnackbarShouldShow: false,
    toDeleteOptionId: null,
    toDeleteRequirementId: null,
    toDeleteOptionName: null,
    toDeleteRequirementName: null
  }

  deleteOptionStateHelper = (snackbarStatus, id, name) => {
    this.setState({
      deleteOptionSnackbarShouldShow: snackbarStatus,
      toDeleteOptionId: id,
      toDeleteOptionName: name
    });
    const { portToBackground } = this.state;
    portToBackground.postMessage({
      msg: 'TO_DELETE_OPTION_STATUS_CHANGED',
      payload: {
        id: id
      }
    });
  }

  deleteRequirementStateHelper = (snackbarStatus, id, name) => {
    this.setState({
      deleteRequirementSnackbarShouldShow: snackbarStatus,
      toDeleteRequirementId: id,
      toDeleteRequirementName: name
    });
    const { portToBackground } = this.state;
    portToBackground.postMessage({
      msg: 'TO_DELETE_REQUIREMENT_STATUS_CHANGED',
      payload: {
        id: id
      }
    });
  }

  showSnackbar = (type, id, name) => {
    // https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_snackbar
    if (type === 'op') {
      this.deleteOptionStateHelper(true, id, name);
      this.deleteOptionSnackbarTimer = setTimeout(() => {
        this.deleteOptionStateHelper(false, null, null);
      }, 5000);
    } else if (type === 'rq') {
      this.deleteRequirementStateHelper(true, id, name);
      this.deleteRequirementSnackbarTimer = setTimeout(() => {
        this.deleteRequirementStateHelper(false, null, null);
      }, 5000);
    }
  }

  componentDidMount() {
    let port = chrome.runtime.connect({name: 'FROM_POPUP'});
    this.setState({portToBackground: port});
    port.postMessage({msg: 'GET_USER_INFO'});
    port.onMessage.addListener((response) => {
      if(response.msg === 'USER_INFO') {
        const { payload } = response;
        setUserIdAndName(payload.userId);
        this.setState({
          loading: false,
          userId: payload.userId,
          userName: payload.userName,
          userProfilePhotoURL: payload.userProfilePhotoURL
        });
        if (payload.userId === 'invalid') {
          this.setState({
            isSigningOut: false
          });
        }
        this.updateTask();
      }
    });

    // event listener
    document.body.addEventListener('keyup', (event) => {
      if (event.keyCode === 13) {
        // Enter key pressed
        if (this.state.isEditingOption) {
          this.submitHandlerForOption(event);
        } 
        if (this.state.isEditingRequirement) {
          this.submitHandlerForRequirement(event);
        }
      }
    });
  }

  updateTask() {
    currentTaskIdRef.on('value', (snapshot) => {
      this.setState({currentTaskId: snapshot.val()});
      if (this.state.currentTaskIdIsLoading) {
        this.setState({currentTaskIdIsLoading: false});
      }
    });

    tasksRef.on('value', (snapshot) => {
      let transformedTasks = [];
      snapshot.forEach((childSnapshot) => {
        transformedTasks.push({
          id: childSnapshot.key,
          taskOngoing:
            childSnapshot.val().taskOngoing === undefined
            ? true
            : childSnapshot.val().taskOngoing,
          completionTimestamp: childSnapshot.val().completionTimestamp,
          displayName: childSnapshot.val().name,
          options: childSnapshot.val().options,
          requirements: childSnapshot.val().requirements,
          currentOptionId: childSnapshot.val().currentOptionId
        })
      });
      this.setState({tasks: transformedTasks});
      if (this.state.tasksIsLoading) {
        this.setState({tasksIsLoading: false});
      }
    });
  }

  switchCurrentTaskHandler = (event) => {
    FirebaseStore.switchCurrentTask(event.target.value);
  }

  /* Deal with options */
  inputChangedHandlerForOption = (event) => {
    this.setState({
      isEditingOption: true,
      isEditingRequirement: false,
      isEditingTaskName: false,
      newOptionInput: event.target.value
    });
  }

  submitHandlerForOption = (event) => {
    event.preventDefault();
    const { newOptionInput } = this.state;
    if (newOptionInput !== '') {
      FirebaseStore.addAnOptionForCurrentTask(this.state.newOptionInput);
    }
    this.setState({newOptionInput: ''});
  }

  updateOptionsOrdering = (ordering) => {
    FirebaseStore.updateOptionsOrdering(ordering);
  }

  switchStarStatusOfOption = (id) => {
    FirebaseStore.switchStarStatusOfAnOptionWithId(id);
  }

  deleteOptionHandler = (id, name) => {
    this.showSnackbar('op', id, name);

    FirebaseStore.switchOptionVisibility(id, false);
    this.deleteOptionTimer = setTimeout(() => {
      FirebaseStore.deleteOptionWithId(id);
    }, 6000);
  }

  undoDeleteOptionHandler = () => {
    clearTimeout(this.deleteOptionTimer);
    clearTimeout(this.deleteOptionSnackbarTimer);
    FirebaseStore.switchOptionVisibility(this.state.toDeleteOptionId, true);
    this.deleteOptionStateHelper(false, null, null);
  }

  updateOptionName = (id, name) => {
    FirebaseStore.updateOptionName(id, name);
  }


  /* Deal with Requirements */
  inputChangedHandlerForRequirement = (event) => {
    this.setState({
      isEditingOption: false,
      isEditingRequirement: true,
      isEditingTaskName: false,
      newRequirementInput: event.target.value
    });
  }

  submitHandlerForRequirement = (event) => {
    event.preventDefault();
    const { newRequirementInput } = this.state;
    if (newRequirementInput !== '') {
      FirebaseStore.addARequirementForCurrentTask(this.state.newRequirementInput);
    }
    this.setState({newRequirementInput: ''});
  }

  updateRequirementsOrdering = (ordering) => {
    FirebaseStore.updateRequirementOrdering(ordering);
  }

  switchStarStatusOfRequirement = (id) => {
    FirebaseStore.switchStarStatusOfARequirementWithId(id);
  }

  deleteRequirementHandler = (id, name) => {
    this.showSnackbar('rq', id, name);

    FirebaseStore.switchRequirementVisibility(id, false);
    this.deleteRequirementTimer = setTimeout(() => {
      FirebaseStore.deleteRequirementWithId(id);
    }, 6000);
  }

  undoDeleteRequirementHandler = () => {
    clearTimeout(this.deleteRequirementTimer);
    clearTimeout(this.deleteRequirementSnackbarTimer);
    FirebaseStore.switchRequirementVisibility(this.state.toDeleteRequirementId, true);
    this.deleteRequirementStateHelper(false, null, null);
  }

  updateRequirementName = (id, name) => {
    FirebaseStore.updateRequirementName(id, name);
  }

  updateTaskName = (id, taskName) => {
    FirebaseStore.updateTaskName(id, taskName);
  }

  openInNewTabClickedHandler = () => {
    console.log('open new tab');
    chrome.runtime.sendMessage({
      msg: 'OPEN_IN_NEW_TAB'
    });
  }

  openSettingsPageClickedHandler = () => {
    console.log('open settings tab');
    chrome.runtime.sendMessage({
      msg: 'OPEN_SETTINGS_PAGE'
    });
  }

  signOutClickedHandler = () => {
    console.log('signing out');
    chrome.runtime.sendMessage({
      msg: 'SIGN_OUT'
    });
    this.setState({
      isSigningOut: true
    });
  }

  switchTaskOngoinghandler = (taskId, shouldTaskBeOngoing, originalShouldTaskBeOngoing) => {
    FirebaseStore.switchTaskWorkingStatus(
      taskId,
      shouldTaskBeOngoing,
      shouldTaskBeOngoing !== originalShouldTaskBeOngoing
    );
  }

  render () {

    let isLoggedIn = !(this.state.userId === null || this.state.userId === 'invalid');

    let appTitle = (
      <AppHeader
        logoSize='38px'
        hover={false}
        shouldDisplayHeaderButtons={isLoggedIn}
        userId={this.state.userId}
        userName={this.state.userName}
        userProfilePhotoURL={this.state.userProfilePhotoURL}
        isSigningOut={this.state.isSigningOut}
        signOutClickedHandler={this.signOutClickedHandler}
        openInNewTabClickedHandler={this.openInNewTabClickedHandler}
        openSettingsPageClickedHandler={this.openSettingsPageClickedHandler}/>
    );

    let toRender;

    if (!isLoggedIn) {
      return (
        <Aux>
          {appTitle}
          {/*<HorizontalDivider margin={dividerOptions.margin.none}/>*/}
          <div
            style={{
              width: '100%',
              height: '100px',
              display: 'flex',
              justifyContent: 'space-around',
              alignItems: 'center'
            }}>
            <div
              className={styles.SignInButton}
              onClick={(event) => this.openInNewTabClickedHandler()}>
              <FontAwesomeIcon icon={fasExternalLinkSquareAlt} className={styles.IconInButton} />
              <span>Sign in</span>
            </div>
          </div>
        </Aux>
      );
    }

    const { currentTaskIdIsLoading, tasksIsLoading } = this.state;

    if ((!currentTaskIdIsLoading) && (!tasksIsLoading)) {
      const { currentTaskId, tasks, newOptionInput, newRequirementInput } = this.state;

      let currentTaskOngoing = null;
      let completionTimestamp = null;
      let currentTaskName = null;
      let currentTaskOptionNames = [];
      let currentTaskRequirementNames = [];
      let currentTaskCurrentOptionId = null;
      if (currentTaskId && tasks.length > 0) {
        let filteredTasks = tasks.filter(t => t.id === currentTaskId);
        if (filteredTasks.length > 0) {
          currentTaskOngoing = filteredTasks[0].taskOngoing;
          if (currentTaskOngoing === false) {
            completionTimestamp = filteredTasks[0].completionTimestamp;
          }
          currentTaskName = filteredTasks[0].displayName;
          currentTaskCurrentOptionId = filteredTasks[0].currentOptionId;
          // options
          currentTaskOptionNames = [];
          for (let opKey in filteredTasks[0].options) {
            currentTaskOptionNames.push({
              id: opKey,
              ...filteredTasks[0].options[opKey]
            });
          }
          // requirements
          currentTaskRequirementNames = [];
          for (let rqKey in filteredTasks[0].requirements) {
            currentTaskRequirementNames.push({
              id: rqKey,
              ...filteredTasks[0].requirements[rqKey]
            });
          }
        } else {
          currentTaskName = 'No active tasks right now...'
        }
      }

      toRender = (
        <Aux>
          
          {appTitle}

          {/*<HorizontalDivider margin={dividerOptions.margin.none}/>*/}

          <CurrentTask
            tasks={tasks}
            currentTaskName={currentTaskName}
            currentTaskId={currentTaskId}
            taskOngoing={currentTaskOngoing}
            completionTimestamp={completionTimestamp}
            switchTaskOngoinghandler={this.switchTaskOngoinghandler}
            onSwitch={this.switchCurrentTaskHandler}
            updateTaskName={this.updateTaskName}/>

          <HorizontalDivider margin={dividerOptions.margin.none}/>

          <div className={styles.OptionsRequiementsContainer}>
            <Options
              options={currentTaskOptionNames}
              activeId={currentTaskCurrentOptionId}
              newOptionValue={newOptionInput}
              changed={this.inputChangedHandlerForOption}
              addOption={this.submitHandlerForOption}
              deleteOptionWithId={this.deleteOptionHandler}
              updateOptionName={this.updateOptionName}
              switchStarStatusOfOption={this.switchStarStatusOfOption}
              updateOptionsOrdering={this.updateOptionsOrdering}/>
            <Requirements
              requirements={currentTaskRequirementNames}
              newRequirementValue={newRequirementInput}
              changed={this.inputChangedHandlerForRequirement}
              addRequirement={this.submitHandlerForRequirement}
              deleteRequirementWithId={this.deleteRequirementHandler}
              updateRequirementsOrdering={this.updateRequirementsOrdering}
              switchStarStatusOfRequirement={this.switchStarStatusOfRequirement}
              updateRequirementName={this.updateRequirementName}/>
          </div>

          <Snackbar 
            id="deleteOptionSnackbar"
            show={this.state.deleteOptionSnackbarShouldShow}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <div className={styles.SnackbarLeft}>
                Option <u>{this.state.toDeleteOptionName}</u> deleted
              </div>
              <div className={styles.SnackbarRight}>
                <button 
                  className={styles.UndoButton}
                  onClick={() => this.undoDeleteOptionHandler()}>UNDO</button>
              </div>
            </div>
          </Snackbar>

          <Snackbar 
            id="deleteRequirementSnackbar"
            show={this.state.deleteRequirementSnackbarShouldShow}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <div className={styles.SnackbarLeft}>
                Criterion <u>{this.state.toDeleteRequirementName}</u> deleted
              </div>
              <div className={styles.SnackbarRight}>
                <button 
                  className={styles.UndoButton}
                  onClick={() => this.undoDeleteRequirementHandler()}>UNDO</button>
              </div>
            </div>
          </Snackbar>

        </Aux>
      );
    }

    return (<div>{toRender}</div>);
  }
}

export default Popup;
