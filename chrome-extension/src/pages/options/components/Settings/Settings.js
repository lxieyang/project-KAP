import React, { Component } from 'react';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import fasWindowMaximize from '@fortawesome/fontawesome-free-regular/faWindowMaximize';
import ToggleSwitch from '../../../../../../shared-components/src/components/UI/ToggleSwitch/ToggleSwitch';
import { 
  userPathInFirestore
} from '../../../../../../shared-components/src/firebase/index';
import * as FirebaseStore from '../../../../../../shared-components/src/firebase/store';
import styles from './Settings.css';

class Settings extends Component {

  state = {
    shouldOverrideNewtab: localStorage.getItem('shouldOverrideNewtab') !== null ? JSON.parse(localStorage.getItem('shouldOverrideNewtab')) : true
  }

  componentDidMount () {
    userPathInFirestore.onSnapshot((doc) => {
      if (doc.exists) {
        const settingsData = doc.data();
        const { shouldOverrideNewtab } = settingsData;
        this.setState({shouldOverrideNewtab});
        localStorage.setItem('shouldOverrideNewtab', shouldOverrideNewtab);
      } else {
        FirebaseStore.switchShouldOverrideNewtab(true);
      }
    });
  }

  switchShouldOverrideNewtabHandler = () => {
    console.log('should switch shouldOverrideNewtab');
    FirebaseStore.switchShouldOverrideNewtab(!this.state.shouldOverrideNewtab);
  }

  render() {
    return (
      <div className={styles.Settings}>
        <div className={styles.Setting}>
          <div className={styles.Left}>
            <div className={styles.Name}>
              <FontAwesomeIcon icon={fasWindowMaximize} /> &nbsp;
              Override the new tab 
            </div>
            <div className={styles.Description}>
              By switching on this option, Chrome will replace the page you see when opening a new tab with the KAP page. If you wish to keep your current new tab page intact (e.g. you have other Chrome extensions like Toby or Momentum that also override the new tab), please switch this off.
            </div>
          </div>
          <div className={styles.Right}>
            <div className={styles.Slider}>
              <ToggleSwitch 
                checked={this.state.shouldOverrideNewtab} 
                statusChanged={this.switchShouldOverrideNewtabHandler}/>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default Settings;
