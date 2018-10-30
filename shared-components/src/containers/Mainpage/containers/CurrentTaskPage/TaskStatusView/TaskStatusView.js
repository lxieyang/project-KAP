import React, { Component } from 'react';
import moment from 'moment';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import fasBriefcase from '@fortawesome/fontawesome-free-solid/faBriefcase';
import fasCircleNotch from '@fortawesome/fontawesome-free-solid/faCircleNotch';
import fasCheck from '@fortawesome/fontawesome-free-solid/faCheck';
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
    isEditingTaskName: false
  }

  componentDidMount() {
    this.inputCallback = debounce((event, id) => {
      FirebaseStore.updateTaskName(id, event.target.innerText.trim());
      event.target.innerText = event.target.innerText.trim();
      event.target.blur();
      this.setState({shouldShowPrompt: false});
    }, 1500);
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

  render () {
    const { task, showoff } = this.props;
    const taskDebrief = "brief description of task \n \n\n\n\n\n";
    return (
      <div className={styles.TaskStatusView}>
        <div className={styles.TaskStatusViewWrapper}>
          <div className={styles.TaskStatusViewLeft}>
            <div className={styles.Title}>
              <div className={styles.Label}>
                <FontAwesomeIcon icon={fasBriefcase} /> Task Name:
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

                  <div className={styles.Title}>
                    <div className={styles.Label}>
                      Task Debrief:
                    </div>
                  </div>
                  <div className={[styles.TaskDebriefContainer].join(' ')}>
                    <div
                      title={'Click to edit'}
                      className={styles.TaskName}
                      contentEditable={showoff == true}
                      suppressContentEditableWarning={true}
                      >
                      {taskDebrief}
                    </div>
                    </div>


                </div>
              </div>
          }

        </div>
      </div>
    )
  }
};

export default TaskStatusView;
