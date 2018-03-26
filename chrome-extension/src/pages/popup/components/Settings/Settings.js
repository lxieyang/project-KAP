import React from 'react';

import FontAwesome from 'react-fontawesome';
import ToggleSwitch from '../../../../components/UI/ToggleSwitch/ToggleSwitch';
import styles from './Settings.css';

// https://www.w3schools.com/howto/howto_css_switch.asp

const settings = (props) => {
  return (
    <div className={styles.Settings}>
      <div className={styles.TempDisable}>
        <div className={styles.Label}>
            <FontAwesome
              name="power-off"
              className={styles.ConfigureIcon}
            /> &nbsp;&nbsp;
            <span>Temporarily disable KAP</span>
        </div>
        <div className={styles.Slider}>
          <ToggleSwitch 
            checked={props.disabled} 
            statusChanged={props.disableHandler}/>
        </div>
      </div>
    </div>
  );
}

export default settings;