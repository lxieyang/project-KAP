import React, { Component } from 'react';
import moment from 'moment';
import ReactMarkdown from 'react-markdown';
import ReactTooltip from 'react-tooltip';
import { Collapse } from 'react-collapse';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import fasBriefcase from '@fortawesome/fontawesome-free-solid/faBriefcase';
import fasCircleNotch from '@fortawesome/fontawesome-free-solid/faCircleNotch';

import fasInfoCircle from '@fortawesome/fontawesome-free-solid/faInfoCircle';
import fasCheck from '@fortawesome/fontawesome-free-solid/faCheck';
import fasAngleRight from '@fortawesome/fontawesome-free-solid/faAngleRight';
import fasAngleDown from '@fortawesome/fontawesome-free-solid/faAngleDown';
import Aux from '../../../../../hoc/Aux/Aux';
import * as FirebaseStore from '../../../../../firebase/store';
import { debounce } from 'lodash';
import ThreeDotsSpinner from '../../../../../components/UI/ThreeDotsSpinner/ThreeDotsSpinner';
import styles from './TaskStatusView.css';

const activeWorkingButtonStyle = {
  color: '#fff',
  backgroundColor: '#4CAF50',
  boxShadow: '0 2px 2px 0 rgba(0,0,0,0.16), 0 2px 2px 0 rgba(0,0,0,0.12)'
};

const activeFinishButtonStyle = {
  color: '#fff',
  backgroundColor: 'rgb(236, 123, 2)',
  boxShadow: '0 2px 2px 0 rgba(0,0,0,0.16), 0 2px 2px 0 rgba(0,0,0,0.12)'
};

class TaskStatusView extends Component {
  state = {
    shouldShowPrompt: false,
    isEditingTaskName: false,
    taskDebriefIsOpen: true,
    taskDebriefIsEditing: false,
    // taskDebriefisFocused: false,
    taskDebiefContent: ''
  }

  switchTaskDebriefEditingStatus = (toStatus) => {
    this.setState({taskDebriefIsEditing: toStatus})
  }

  switchTaskDebriefIsOpenStatus = () => {
    this.setState(prevState => {
      return { taskDebriefIsOpen: !prevState.taskDebriefIsOpen };
    });
  }

  componentDidMount() {
    this.inputCallback = debounce((event, id) => {
      FirebaseStore.updateTaskName(id, event.target.innerText.trim());
      event.target.innerText = event.target.innerText.trim();
      event.target.blur();
      this.setState({shouldShowPrompt: false});
    }, 1500);

    this.updatetaskDebiefContent(this.props.task);
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    this.updatetaskDebiefContent(nextProps.task);
  }

  updatetaskDebiefContent = (task) => {
    let debriefContent = task.debrief !== undefined ? task.debrief : '';
    this.setState({taskDebiefContent: debriefContent});
  }

  inputChangedHandler = (event, id) => {
    event.persist();
    this.setState({shouldShowPrompt: true});
    this.inputCallback(event, id);
  }

  switchEditingTaskNameStatus = () => {
    this.setState(prevState => {
      return {isEditingTaskName: !prevState.isEditingTaskName}
    })
  }

  switchTaskOngoinghandler = (taskId, shouldTaskBeOngoing, originalShouldTaskBeOngoing) => {
    FirebaseStore.switchTaskWorkingStatus(
      taskId,
      shouldTaskBeOngoing,
      shouldTaskBeOngoing !== originalShouldTaskBeOngoing
    );
  }

  taskDebriefContentChangedHandler = (event, id) => {
    let content = event.target.innerText;
    this.setState({taskDebiefContent: content});
  }

  taskDebriefEditButtonClicked = (event, id, toStatus) => {
    console.log('onclick');
    if (this.state.taskDebriefIsEditing) {
      FirebaseStore.updateTaskDebrief(id, this.state.taskDebiefContent);
    } 
    this.switchTaskDebriefEditingStatus(toStatus);
    
  }

  taskDebriefOnFocus = (event, id) => {
    // this.setState({taskDebriefisFocused: true});
  }

  taskDebriefOnBlur = (event, id) => {
    // this.setState({taskDebriefisFocused: false});
    // FirebaseStore.updateTaskDebrief(id, this.state.taskDebiefContent);
    FirebaseStore.updateTaskDebrief(id, this.state.taskDebiefContent);
  }

  render () {
    const { task, showoff } = this.props;
    let { debrief } = task;
    debrief = debrief !== undefined && debrief.trim() !== '' ? debrief : '';

    return (
      <div className={styles.TaskStatusView}>
        <div className={styles.TaskStatusViewWrapper}>
          <div className={styles.TaskStatusViewLeft}>
            <div className={styles.Title}>
              <div className={styles.Label}>
                { showoff === true ? 'Question:' : 'Task Name' }
              </div>
            </div>
            <div className={[styles.TaskNameContainer, this.state.isEditingTaskName ? styles.isEditing : null].join(' ')}>
              <div
                title={'Click to edit'}
                className={styles.TaskName}
                contentEditable={showoff !== true}
                suppressContentEditableWarning={true}
                onInput={(event) => this.inputChangedHandler(event, task.id)}
                onFocus={() => this.switchEditingTaskNameStatus()}
                onBlur={() => this.switchEditingTaskNameStatus()}>
                {task.displayName}
              </div>

              {this.state.shouldShowPrompt === true
                ? <div className={styles.PromptAutoSaved}>
                    <span>Edits will automatically be saved <ThreeDotsSpinner /></span>
                  </div>
                : null
              }
            </div>
            <div 
              className={styles.TaskDebriefCollapseButton}>
              <a 
                className={this.state.taskDebriefIsOpen ? styles.TaskDebriefIconOpen : styles.TaskDebriefIconClosed }
                data-tip data-for='toggleTaskDebrief' 
                onClick={(event) => this.switchTaskDebriefIsOpenStatus(event)}>
                {/*<FontAwesomeIcon icon={this.state.taskDebriefIsOpen ? fasAngleDown : fasAngleRight}/>*/}
                <FontAwesomeIcon icon={fasInfoCircle}/>
              </a>
              <ReactTooltip
                id='toggleTaskDebrief'
                type='dark'
                effect='solid'
                place={'bottom'}
                // globalEventOff='click'
                className={styles.EditSaveButtonTooltipContainer}>
                {
                  this.state.taskDebriefIsOpen
                  ? 'Hide description'
                  : 'Show description'
                }
              </ReactTooltip>
            </div>
          </div>

          {
            showoff === true
            ? null
            : <div className={styles.TaskStatusViewRight}>
                <div className={styles.StatusButtonsContainer}>
                  <div
                    title={`I'm still working on this.`}
                    className={styles.StatusButton}
                    style={
                      task.taskOngoing === true ? activeWorkingButtonStyle : null
                    }
                    onClick={(event) => this.switchTaskOngoinghandler(task.id, true, task.taskOngoing)}>
                    <FontAwesomeIcon icon={fasCircleNotch} style={{marginRight: '4px'}}/>
                    Ongoing...
                  </div>
                  <div
                    title={`I've completed it!`}
                    className={styles.StatusButton}
                    style={
                      task.taskOngoing === false ? activeFinishButtonStyle : null
                    }
                    onClick={(event) => this.switchTaskOngoinghandler(task.id, false, task.taskOngoing)}>
                    <FontAwesomeIcon icon={fasCheck} style={{marginRight: '4px'}}/>
                    Completed!
                    {
                      task.completionTimestamp !== null && task.completionTimestamp !== undefined ? ` (${moment(task.completionTimestamp).fromNow()})` : null
                    }
                  </div>
                </div>
              </div>
          }

        </div>
        <Collapse isOpened={this.state.taskDebriefIsOpen} springConfig={{stiffness: 700, damping: 50}}>
          <div className={styles.TaskDebriefContainer}>
            <div className={styles.Title}>
              <div 
                className={[styles.Label, styles.TaskDebriefTitleLabel].join(' ')}
                style={{display: showoff === true ? 'none' : null}}> 
                {/*<FontAwesomeIcon icon={fasInfoCircle} /> */} Description
              </div>
              <div 
                style={{display: showoff === true ? 'none' : null}}
                className={styles.EditSaveButton}
                onClick={(event) => this.taskDebriefEditButtonClicked(event, task.id, !this.state.taskDebriefIsEditing)}>
                {
                  this.state.taskDebriefIsEditing ? 'save' : 'edit'
                }
              </div>
            </div>
            
            <div className={styles.TaskDebriefViewWrapper}>
              {
                this.state.taskDebriefIsEditing
                ? <div 
                    className={styles.TaskDebriefEditBox}
                    contentEditable={this.state.taskDebriefIsEditing === true ? true : false}
                    placeholder='Add some brief description to this task'
                    suppressContentEditableWarning={true}
                    onInput={(event) => this.taskDebriefContentChangedHandler(event, task.id)}
                    onFocus={(event) => this.taskDebriefOnFocus(event, task.id)}
                    onBlur={(event) => this.taskDebriefOnBlur(event, task.id)}>
                    { debrief }
                  </div>
                : null
              }
              <div 
                className={styles.MarkdownContent} 
                style={{flex: this.state.taskDebriefIsEditing ? '50%' : null}}>
                <ReactMarkdown source={this.state.taskDebiefContent}/>
              </div>
            </div>
          </div>  
        </Collapse>
        
      </div>
    )
  }
};

export default TaskStatusView;
