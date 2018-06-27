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
import Settings from './components/Settings/Settings';
import Spinner from '../../../../shared-components/src/components/UI/Spinner/Spinner';
import { DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import { 
  tasksRef,
  currentTaskIdRef,
  isDisabledRef,
  setUserIdAndName
} from '../../../../shared-components/src/firebase/index';
import * as FirebaseStore from '../../../../shared-components/src/firebase/store';
import styles from './Popup.css';

const dividerOptions = {
  margin: {
    long: '10px',
    short: '30px'
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
    currentTaskIdIsLoading: true,
    tasksIsLoading: true,
    enabled: true,
    loading: true,
    userId: null
  }

  componentDidMount() {
    chrome.runtime.sendMessage({
      msg: 'GET_WORKING_STATUS'
    }, (data) => {
      console.log('WORKING STATUS: ' + data.status);
      this.setState({enabled: data.status});
    });

    chrome.runtime.onMessage.addListener(
      (request, sender, sendResponse) => {
        if (request.msg === 'CURRENT_WORKING_STATUS') {
          console.log('WORKING STATUS: ' + request.payload.status);      
          this.setState({enabled: request.payload.status});
        }
      }
    )

    let port = chrome.runtime.connect({name: 'FROM_POPUP'});
    port.postMessage({msg: 'GET_USER_INFO'});
    port.onMessage.addListener((response) => {
      if(response.msg === 'USER_INFO') {
        const { payload } = response;
        setUserIdAndName(payload.userId);
        this.setState({
          loading: false,
          userId: payload.userId
        });
        this.updateTask();
      }
    });

    // event listener
    document.body.addEventListener('keyup', (event) => {
      if (event.keyCode === 13) {
        // Enter key pressed
        if (this.state.isEditingOption) {
          this.submitHandlerForOption(event);
        } else {
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

    isDisabledRef.on('value', (snapshot) => {
      this.setState({disabled: snapshot.val() !== null ? snapshot.val() : false})
    });
  }

  switchCurrentTaskHandler = (event) => {    
    FirebaseStore.switchCurrentTask(event.target.value);
  }

  /* Deal with options */
  inputChangedHandlerForOption = (event) => {
    this.setState({
      isEditingOption: true,
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

  deleteOptionHandler = (id) => {
    FirebaseStore.deleteOptionWithId(id);
  }

  updateOptionName = (id, name) => {
    FirebaseStore.updateOptionName(id, name);
  }
  

  /* Deal with Requirements */
  inputChangedHandlerForRequirement = (event) => {
    this.setState({
      isEditingOption: false,
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

  deleteRequirementHandler = (id) => {
    FirebaseStore.deleteRequirementWithId(id);
  }

  updateRequirementName = (id, name) => {
    FirebaseStore.updateRequirementName(id, name);
  }

  updateTaskName = (id, taskName) => {
    FirebaseStore.updateTaskName(id, taskName);
  }

  disablePluginHandler = () => {
    // FirebaseStore.switchWorkingStatus();
    console.log('changed status');
    chrome.runtime.sendMessage({
      msg: 'SWITCH_WORKING_STATUS'
    });
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

  render () {

    let isLoggedIn = !(this.state.userId === null || this.state.userId === 'invalid');

    let appTitle = (
      <AppHeader 
        logoSize='38px' 
        hover={false}
        shouldDisplayHeaderButtons={isLoggedIn}
        openInNewTabClickedHandler={this.openInNewTabClickedHandler}
        openSettingsPageClickedHandler={this.openSettingsPageClickedHandler}/>
    );

    let toRender;

    if (!isLoggedIn) {
      toRender = (
        <Aux>
          {appTitle}
          <HorizontalDivider margin={dividerOptions.margin.short}/>
          <div style={{width: '100%', height: '240px', display: 'flex', justifyContent: 'space-around', alignItems: 'center'}}>
            <div className={styles.GoToNewTabBtn} onClick={(event) => this.openInNewTabClickedHandler()}>
              Please sign in from a new tab! &nbsp;
              <FontAwesomeIcon icon={fasExternalLinkSquareAlt} />
            </div>
          </div>
        </Aux>
      );

      return (<div>{toRender}</div>);
    }

    const { currentTaskIdIsLoading, tasksIsLoading, enabled } = this.state;

    if ((!currentTaskIdIsLoading) && (!tasksIsLoading)) {
      const { currentTaskId, tasks, newOptionInput, newRequirementInput } = this.state;

      let currentTaskName = null;
      let currentTaskOptionNames = [];
      let currentTaskRequirementNames = [];
      let currentTaskCurrentOptionId = null;
      if (currentTaskId && tasks.length > 0) {
        let filteredTasks = tasks.filter(t => t.id === currentTaskId);
        if (filteredTasks.length > 0) {
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

          <HorizontalDivider margin={dividerOptions.margin.long}/>

          <CurrentTask 
            tasks={tasks} 
            currentTaskName={currentTaskName}
            currentTaskId={currentTaskId} 
            onSwitch={this.switchCurrentTaskHandler}
            updateTaskName={this.updateTaskName}/>

          <HorizontalDivider margin={dividerOptions.margin.short}/>

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
          
          {/*
          <HorizontalDivider margin={dividerOptions.margin.long}/>

          <Settings enabled={enabled} disableHandler={this.disablePluginHandler}/>
          */}
        </Aux>
      );
    }

    return (<div>{toRender}</div>);
  }
}

export default Popup;
