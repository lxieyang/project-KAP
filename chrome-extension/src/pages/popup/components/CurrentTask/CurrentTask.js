import React, { Component } from 'react';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import farClock from '@fortawesome/fontawesome-free-regular/faClock';
import fasDiagnoses from '@fortawesome/fontawesome-free-solid/faDiagnoses';
import fasCheck from '@fortawesome/fontawesome-free-solid/faCheck';
import Input from '../../../../../../shared-components/src/components/UI/Input/Input';
import { debounce } from 'lodash';
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

  componentDidMount() {
    this.inputCallback = debounce((event, id) => {
      this.props.updateTaskName(id, event.target.innerText.trim());
      event.target.innerText = event.target.innerText.trim();
      event.target.blur();
    }, 2000);
  }

  inputChangedHandler = (event, id) => {
    event.persist();
    this.inputCallback(event, id);
  }


  render () {
    const { currentTaskId, taskOngoing, currentTaskName, onSwitch, switchTaskOngoinghandler } = this.props;

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
            <div className={styles.StatusButtonsContainer}>
              <div 
                className={styles.StatusButton}
                style={
                  taskOngoing === true ? activeWorkingButtonStyle : null
                }
                onClick={(event) => switchTaskOngoinghandler(currentTaskId, true, taskOngoing)}>
                <FontAwesomeIcon icon={fasDiagnoses} style={{marginRight: '4px'}}/>
                Still working on it...
              </div>
              <div 
                className={styles.StatusButton}
                style={
                  taskOngoing === false ? activeFinishButtonStyle : null
                }
                onClick={(event) => switchTaskOngoinghandler(currentTaskId, false, taskOngoing)}>
                <FontAwesomeIcon icon={fasCheck} style={{marginRight: '4px'}}/>
                Completed!
              </div>
            </div>
          </div>
          <div className={styles.TaskNameContainer}>
            <div 
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
          
        </div>
      </div>
    );
  }
  
};

export default CurrentTask;