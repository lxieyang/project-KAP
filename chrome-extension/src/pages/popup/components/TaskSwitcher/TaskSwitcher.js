import React from 'react';

import FontAwesome from 'react-fontawesome';
import Input from '../../../../components/UI/Input/Input';
import styles from './TaskSwitcher.css';

// const selectConfig = {
//   options: [
//     {
//       value: 'How to store information in chrome extension?',
//       displayName: 'How to store information in chrome extension?'
//     },
//     {
//       value: 'What javascript frontend framework to use?',
//       displayName: 'What javascript frontend framework to use?'
//     },
//     {
//       value: 'How to center a div inside a parent div?',
//       displayName: 'How to center a div inside a parent div?'
//     }
//   ]
// }

const taskSwitcher = (props) => {
  let selectConfig = {
    options: props.tasks.length > 0
            ? props.tasks
            : []
  }

  return (
    <div style={{display: 'flex'}}>
      <div className={styles.TaskSwitcher}>
        <div className={styles.Label}>
          <FontAwesome
            name="exchange"
            className={styles.ConfigureIcon}
          /> &nbsp;&nbsp;
          <span>Switch Task to:</span>
        </div>
        <div className={styles.TaskSelect}>
          <Input elementType='select' elementConfig={selectConfig} value={props.currentTaskId ? props.currentTaskId : ''} changed={props.onSwitch} />
        </div>
      </div>
    </div>
  );
}

export default taskSwitcher;