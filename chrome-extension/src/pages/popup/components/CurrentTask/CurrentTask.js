import React, { Component } from 'react';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import farClock from '@fortawesome/fontawesome-free-regular/faClock';
import Input from '../../../../../../shared-components/src/components/UI/Input/Input';
import { debounce } from 'lodash';
import styles from './CurrentTask.css';

/*
  props:
    - taskName:
*/

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
    let selectConfig = {
      options: this.props.tasks.length > 0
              ? this.props.tasks
              : []
    };
  
    return (
      <div style={{display: 'flex'}}>
        <div className={styles.CurrentTask}>
          <div className={styles.Label}>
            <FontAwesomeIcon icon={farClock} /> &nbsp;
            Current Task:
          </div>
          <div className={styles.TaskNameContainer}>
            <div 
              className={styles.TaskName}
              contentEditable={true}
              suppressContentEditableWarning={true}
              onInput={(event) => this.inputChangedHandler(event, this.props.currentTaskId)}>
              {this.props.currentTaskName}
            </div>
            <div className={styles.TaskSelect}>
              <Input elementType='select' elementConfig={selectConfig} value={this.props.currentTaskId ? this.props.currentTaskId : ''} changed={this.props.onSwitch} />
            </div>
          </div>
          
        </div>
      </div>
    );
  }
  
};

export default CurrentTask;