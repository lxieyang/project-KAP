import React from 'react';

import Input from '../../../../../../shared-components/src/components/UI/Input/Input';
import styles from './CurrentTask.css';

/*
  props:
    - taskName:
*/

const currentTask = (props) => {
  let selectConfig = {
    options: props.tasks.length > 0
            ? props.tasks
            : []
  };

  return (
    <div style={{display: 'flex'}}>
      <div className={styles.CurrentTask}>
        <div className={styles.Label}>
          Current Task:
        </div>
        <div className={styles.TaskNameContainer}>
          <div className={styles.TaskName}>
            {props.currentTaskName}
          </div>
          <div className={styles.TaskSelect}>
            <Input elementType='select' elementConfig={selectConfig} value={props.currentTaskId ? props.currentTaskId : ''} changed={props.onSwitch} />
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default currentTask;