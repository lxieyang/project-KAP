import React, { Component } from 'react';
import moment from 'moment';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import farClock from '@fortawesome/fontawesome-free-regular/faClock';
import fasCircleNotch from '@fortawesome/fontawesome-free-solid/faCircleNotch';
import fasCheck from '@fortawesome/fontawesome-free-solid/faCheck';
import Input from '../../../../../../shared-components/src/components/UI/Input/Input';
import { debounce } from 'lodash';
import ThreeDotsSpinner from '../../../../../../shared-components/src/components/UI/ThreeDotsSpinner/ThreeDotsSpinner';
import styles from './CurrentTask.css';


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

class CurrentTask extends Component {
  state = {
    shouldShowPrompt: false
  }

  componentDidMount() {
    this.inputCallback = debounce((event, id) => {
      this.props.updateTaskName(id, event.target.innerText.trim());
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


  render () {
    const { currentTaskId, currentTaskName, taskOngoing, completionTimestamp, onSwitch, switchTaskOngoinghandler } = this.props;

    let selectConfig = {
      options: this.props.tasks.length > 0
              ? this.props.tasks
              : []
    };
  
    return (
      <div style={{display: 'flex'}}>
        <div className={styles.CurrentTask}>
          <div className={styles.Title}>
            <div className={styles.Label}>
              <FontAwesomeIcon icon={farClock} /> &nbsp;
              Current Task
            </div>
          </div>
          <div className={styles.TaskNameContainer}>
            <div 
              title={'Click to edit'}
              className={styles.TaskName}
              contentEditable={true}
              suppressContentEditableWarning={true}
              onInput={(event) => this.inputChangedHandler(event, currentTaskId)}>
              {currentTaskName}
            </div>
            <div className={styles.TaskSelect}>
              <Input elementType='select' elementConfig={selectConfig} value={currentTaskId ? currentTaskId : ''} changed={onSwitch} />
            </div>
          </div>

          <div className={styles.PromptAutoSaved}>
            {this.state.shouldShowPrompt === true 
              ? <span>
                  Edits will automatically be saved <ThreeDotsSpinner />
                </span>
              : null}
          </div>

          <div>
            <div className={styles.StatusButtonsContainer}>
              <div 
                className={styles.StatusButton}
                style={
                  taskOngoing === true ? activeWorkingButtonStyle : null
                }
                onClick={(event) => switchTaskOngoinghandler(currentTaskId, true, taskOngoing)}>
                <FontAwesomeIcon icon={fasCircleNotch} style={{marginRight: '4px'}}/>
                Ongoing...
              </div>
              <div 
                className={styles.StatusButton}
                style={
                  taskOngoing === false ? activeFinishButtonStyle : null
                }
                onClick={(event) => switchTaskOngoinghandler(currentTaskId, false, taskOngoing)}>
                <FontAwesomeIcon icon={fasCheck} style={{marginRight: '4px'}}/>
                Completed!
                {
                  completionTimestamp !== null ? ` (${moment(completionTimestamp).fromNow()})` : null
                }
              </div>
            </div>
          </div>
          
        </div>
      </div>
    );
  }
  
};

export default CurrentTask;