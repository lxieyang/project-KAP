import React, { Component } from 'react';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import ToggleSwitch from '../../../../../../../shared-components/src/components/UI/ToggleSwitch/ToggleSwitch';
import styles from './Setting.css';

class Setting extends Component {
  render() {
    return (
      <div className={styles.Setting}>
        <div className={styles.Left}>
          <div className={styles.Name}>
            <FontAwesomeIcon icon={this.props.icon} /> &nbsp;
            {this.props.name}
          </div>
          <div className={styles.Description}>
            {this.props.description}
          </div>
        </div>
        <div className={styles.Right}>
          <div className={styles.Slider}>
            <ToggleSwitch 
              checked={this.props.checked} 
              statusChanged={this.props.statusChanged}/>
          </div>
        </div>
      </div>
    )
  }
}

export default Setting;