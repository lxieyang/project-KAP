/* global chrome */
import React, { Component } from "react";

import Aux from '../../../../shared-components/src/hoc/Aux/Aux';
import AppHeader from '../../../../shared-components/src/components/UI/AppHeader/AppHeader';
import HorizontalDivider from '../../../../shared-components/src/components/UI/Divider/HorizontalDivider/HorizontalDivider';
import CurrentTask from './components/CurrentTask/CurrentTask';
import Options from './components/Options/Options';
import Requirements from './components/Requirements/Requirements';
import Settings from './components/Settings/Settings';
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
    disabled: false
  }

  componentDidMount() {
    let port = chrome.runtime.connect({name: 'FROM_POPUP'});
    port.postMessage({msg: 'GET_USER_INFO'});
    port.onMessage.addListener((response) => {
      if(response.msg === 'USER_INFO') {
        const { payload } = response;
        setUserIdAndName(payload.userId);
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

  deleteOptionHandler = (id) => {
    FirebaseStore.deleteOptionWithId(id);
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

  disablePluginHandler = () => {
    FirebaseStore.switchWorkingStatus();
  }

  render () {
    let appTitle = (<AppHeader logoSize='38px' hover={false}/>);

    const { currentTaskIdIsLoading, tasksIsLoading, disabled } = this.state;

    let toRender = (
      <Aux>{appTitle}</Aux>
    );
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
            onSwitch={this.switchCurrentTaskHandler}/>

          <HorizontalDivider margin={dividerOptions.margin.short}/>

          <div className={styles.OptionsRequiementsContainer}>
            <Options 
              options={currentTaskOptionNames} 
              activeId={currentTaskCurrentOptionId}
              newOptionValue={newOptionInput}
              changed={this.inputChangedHandlerForOption}
              addOption={this.submitHandlerForOption}
              deleteOptionWithId={this.deleteOptionHandler}/>
            <Requirements 
              requirements={currentTaskRequirementNames} 
              newRequirementValue={newRequirementInput}
              changed={this.inputChangedHandlerForRequirement}
              addRequirement={this.submitHandlerForRequirement}
              deleteRequirementWithId={this.deleteRequirementHandler}
              updateRequirementsOrdering={this.updateRequirementsOrdering}
              switchStarStatusOfRequirement={this.switchStarStatusOfRequirement}/>
          </div>
          

          <HorizontalDivider margin={dividerOptions.margin.long}/>

          <Settings disabled={disabled} disableHandler={this.disablePluginHandler}/>
        </Aux>
      );
    }

    return (
      <div>
        {toRender}   
      </div>
    );
  }
}

export default Popup;
