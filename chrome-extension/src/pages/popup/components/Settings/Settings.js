import React from 'react';

import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import fasPowerOff from '@fortawesome/fontawesome-free-solid/faPowerOff';
import ToggleSwitch from '../../../../../../shared-components/src/components/UI/ToggleSwitch/ToggleSwitch';
import styles from './Settings.css';

// https://www.w3schools.com/howto/howto_css_switch.asp

const settings = (props) => {
  return (
    <div className={styles.Settings}>
      <div className={styles.TempDisable}>
        <div className={styles.Label}>
          <FontAwesomeIcon
            icon={fasPowerOff}
            className={styles.ConfigureIcon}
          /> &nbsp;
          {
            props.enabled === true
            ? <span>UNAKITE Enabled</span>
            : <span>UNAKITE Disabled</span>
          } 
        </div>
        <div className={styles.Slider}>
          <ToggleSwitch 
            checked={props.enabled} 
            statusChanged={props.disableHandler}/>
        </div>
      </div>
    </div>
  );
}

export default settings;